import { UserRole, type Prisma, type UserRole as UserRoleType } from "@prisma/client";

import { ApiError } from "../../common/utils/api-error";
import { prisma } from "../../config/prisma";

import type { ListUsersQueryInput, UpdateUserInput } from "./users.validation";

type UserContext = {
  userId: string;
  role: UserRoleType;
};

const userSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  role: true,
  status: true,
  avatarUrl: true,
  managerId: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true
} satisfies Prisma.UserSelect;

const normalizeOptionalString = (value?: string | null): string | null | undefined => {
  if (value === null) {
    return null;
  }

  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const calculatePagination = (page: number, limit: number) => {
  const safePage = page > 0 ? page : 1;
  const safeLimit = limit > 0 ? limit : 20;

  return {
    skip: (safePage - 1) * safeLimit,
    take: safeLimit
  };
};

const getAccessFilter = (context: UserContext): Prisma.UserWhereInput | undefined => {
  if (context.role === "ADMIN") {
    return undefined;
  }

  if (context.role === "MANAGER") {
    return {
      OR: [{ id: context.userId }, { managerId: context.userId }]
    };
  }

  return {
    id: context.userId
  };
};

const ensureUserAccess = async (userId: string, context: UserContext) => {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user || user.deletedAt) {
    throw new ApiError(404, "User not found");
  }

  if (context.role === "ADMIN") {
    return user;
  }

  if (context.role === "AGENT" && user.id !== context.userId) {
    throw new ApiError(403, "Forbidden");
  }

  if (context.role === "MANAGER") {
    if (user.id === context.userId) {
      return user;
    }

    if (user.role !== "AGENT" || user.managerId !== context.userId) {
      throw new ApiError(403, "Forbidden");
    }
  }

  return user;
};

const ensureManagerExists = async (managerId: string) => {
  const manager = await prisma.user.findUnique({
    where: { id: managerId }
  });

  if (!manager || manager.deletedAt) {
    throw new ApiError(404, "Manager not found");
  }

  if (manager.role !== UserRole.MANAGER && manager.role !== UserRole.ADMIN) {
    throw new ApiError(400, "Selected manager is invalid");
  }

  return manager;
};

export class UsersService {
  static async listUsers(query: ListUsersQueryInput, context: UserContext) {
    const accessFilter = getAccessFilter(context);
    const search = normalizeOptionalString(query.search);

    const where: Prisma.UserWhereInput = {
      AND: [
        accessFilter,
        { deletedAt: null },
        query.role ? { role: query.role } : undefined,
        query.status ? { status: query.status } : undefined,
        query.managerId && context.role !== "AGENT" ? { managerId: query.managerId } : undefined,
        search
          ? {
              OR: [
                { firstName: { contains: search } },
                { lastName: { contains: search } },
                { email: { contains: search } },
                { phone: { contains: search } }
              ]
            }
          : undefined
      ].filter(Boolean) as Prisma.UserWhereInput[]
    };

    const { skip, take } = calculatePagination(query.page, query.limit);

    const [items, total] = await prisma.$transaction([
      prisma.user.findMany({
        where,
        skip,
        take,
        select: {
          ...userSelect,
          manager: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          _count: {
            select: {
              assignedLeads: true,
              clientsOwned: true,
              dealsOwned: true
            }
          }
        },
        orderBy: {
          createdAt: "desc"
        }
      }),
      prisma.user.count({ where })
    ]);

    return {
      items,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit)
      }
    };
  }

  static async listAgents(context: UserContext) {
    const accessFilter = context.role === "ADMIN" ? undefined : { managerId: context.userId };

    return prisma.user.findMany({
      where: {
        AND: [
          accessFilter,
          { deletedAt: null },
          {
            role: {
              in: [UserRole.AGENT, UserRole.MANAGER]
            }
          },
          {
            status: "ACTIVE"
          }
        ].filter(Boolean) as Prisma.UserWhereInput[]
      },
      select: userSelect,
      orderBy: {
        firstName: "asc"
      }
    });
  }

  static async getUserById(userId: string, context: UserContext) {
    await ensureUserAccess(userId, context);

    return prisma.user.findUnique({
      where: { id: userId },
      select: {
        ...userSelect,
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        agents: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            status: true
          }
        }
      }
    });
  }

  static async updateUser(userId: string, input: UpdateUserInput, context: UserContext) {
    const target = await ensureUserAccess(userId, context);

    const data: Prisma.UserUpdateInput = {
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      phone: normalizeOptionalString(input.phone) ?? undefined,
      avatarUrl: normalizeOptionalString(input.avatarUrl) ?? undefined
    };

    if (input.status !== undefined) {
      if (context.role === "AGENT") {
        throw new ApiError(403, "Only managers or admins can update status");
      }

      data.status = input.status;
    }

    if (input.role !== undefined) {
      if (context.role !== "ADMIN") {
        throw new ApiError(403, "Only admins can update user roles");
      }

      data.role = input.role;
    }

    if (input.managerId !== undefined) {
      if (context.role === "AGENT") {
        throw new ApiError(403, "Only managers or admins can update manager mapping");
      }

      if (context.role === "MANAGER" && input.managerId !== context.userId && input.managerId !== null) {
        throw new ApiError(403, "Managers can assign only their own id");
      }

      if (input.managerId === null) {
        data.manager = { disconnect: true };
      } else if (input.managerId) {
        await ensureManagerExists(input.managerId);

        data.manager = {
          connect: {
            id: input.managerId
          }
        };
      }
    }

    if (context.role === "MANAGER" && target.role !== "AGENT" && target.id !== context.userId) {
      throw new ApiError(403, "Managers can only update agents in their team");
    }

    return prisma.user.update({
      where: { id: userId },
      data,
      select: userSelect
    });
  }
}
