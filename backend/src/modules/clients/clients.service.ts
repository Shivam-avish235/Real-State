import type { Prisma, UserRole } from "@prisma/client";

import { ApiError } from "../../common/utils/api-error";
import { prisma } from "../../config/prisma";

import type {
    AddClientInteractionInput,
    AddClientVisitInput,
    CreateClientInput,
    ListClientsQueryInput,
    UpdateClientInput
} from "./clients.validation";

type UserContext = {
  userId: string;
  role: UserRole;
};

const normalizeOptionalString = (value?: string): string | undefined => {
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const getAgentScopedFilter = (context: UserContext): Prisma.ClientWhereInput | undefined => {
  if (context.role !== "AGENT") {
    return undefined;
  }

  return {
    ownerAgentId: context.userId
  };
};

const ensureClientAccess = async (clientId: string, context: UserContext) => {
  const client = await prisma.client.findUnique({
    where: { id: clientId }
  });

  if (!client) {
    throw new ApiError(404, "Client not found");
  }

  if (context.role === "AGENT" && client.ownerAgentId !== context.userId) {
    throw new ApiError(403, "Forbidden");
  }

  return client;
};

const calculatePagination = (page: number, limit: number) => {
  const safePage = page > 0 ? page : 1;
  const safeLimit = limit > 0 ? limit : 20;

  return {
    skip: (safePage - 1) * safeLimit,
    take: safeLimit
  };
};

export class ClientsService {
  static async listClients(query: ListClientsQueryInput, context: UserContext) {
    const scopedFilter = getAgentScopedFilter(context);
    const search = normalizeOptionalString(query.search);

    const where: Prisma.ClientWhereInput = {
      AND: [
        scopedFilter,
        query.type ? { type: query.type } : undefined,
        query.ownerAgentId && context.role !== "AGENT" ? { ownerAgentId: query.ownerAgentId } : undefined,
        search
          ? {
              OR: [
                { firstName: { contains: search } },
                { lastName: { contains: search } },
                { companyName: { contains: search } },
                { email: { contains: search } },
                { phone: { contains: search } }
              ]
            }
          : undefined
      ].filter(Boolean) as Prisma.ClientWhereInput[]
    };

    const { skip, take } = calculatePagination(query.page, query.limit);

    const [items, total] = await prisma.$transaction([
      prisma.client.findMany({
        where,
        skip,
        take,
        include: {
          ownerAgent: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          lead: {
            select: {
              id: true,
              status: true,
              source: true
            }
          },
          _count: {
            select: {
              visits: true,
              deals: true,
              activities: true,
              reminders: true
            }
          }
        },
        orderBy: {
          createdAt: "desc"
        }
      }),
      prisma.client.count({ where })
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

  static async createClient(input: CreateClientInput, context: UserContext) {
    const ownerAgentId = context.role === "AGENT" ? context.userId : input.ownerAgentId;

    if (input.leadId) {
      const lead = await prisma.lead.findUnique({
        where: { id: input.leadId }
      });

      if (!lead) {
        throw new ApiError(404, "Linked lead not found");
      }
    }

    return prisma.client.create({
      data: {
        type: input.type,
        firstName: input.firstName,
        lastName: normalizeOptionalString(input.lastName),
        companyName: normalizeOptionalString(input.companyName),
        email: normalizeOptionalString(input.email),
        phone: input.phone,
        alternatePhone: normalizeOptionalString(input.alternatePhone),
        budgetMin: input.budgetMin,
        budgetMax: input.budgetMax,
        preferences: input.preferences,
        addressLine1: normalizeOptionalString(input.addressLine1),
        addressLine2: normalizeOptionalString(input.addressLine2),
        city: normalizeOptionalString(input.city),
        state: normalizeOptionalString(input.state),
        country: normalizeOptionalString(input.country),
        zipCode: normalizeOptionalString(input.zipCode),
        notes: normalizeOptionalString(input.notes),
        ownerAgentId: normalizeOptionalString(ownerAgentId),
        leadId: normalizeOptionalString(input.leadId)
      },
      include: {
        ownerAgent: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        lead: {
          select: {
            id: true,
            status: true,
            source: true
          }
        }
      }
    });
  }

  static async getClientById(clientId: string, context: UserContext) {
    await ensureClientAccess(clientId, context);

    return prisma.client.findUnique({
      where: { id: clientId },
      include: {
        ownerAgent: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        lead: {
          select: {
            id: true,
            status: true,
            source: true
          }
        },
        deals: {
          select: {
            id: true,
            title: true,
            stage: true,
            status: true,
            dealValue: true,
            closeDate: true,
            createdAt: true
          },
          orderBy: {
            createdAt: "desc"
          }
        },
        visits: {
          include: {
            property: {
              select: {
                id: true,
                title: true,
                city: true,
                state: true,
                listingPrice: true,
                status: true
              }
            }
          },
          orderBy: {
            visitAt: "desc"
          }
        },
        activities: {
          include: {
            createdBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          },
          orderBy: {
            performedAt: "desc"
          },
          take: 30
        }
      }
    });
  }

  static async updateClient(clientId: string, input: UpdateClientInput, context: UserContext) {
    await ensureClientAccess(clientId, context);

    const ownerAgentId = context.role === "AGENT" ? context.userId : input.ownerAgentId;

    return prisma.client.update({
      where: { id: clientId },
      data: {
        type: input.type,
        firstName: input.firstName,
        lastName: input.lastName,
        companyName: input.companyName,
        email: input.email,
        phone: input.phone,
        alternatePhone: input.alternatePhone,
        budgetMin: input.budgetMin,
        budgetMax: input.budgetMax,
        preferences: input.preferences,
        addressLine1: input.addressLine1,
        addressLine2: input.addressLine2,
        city: input.city,
        state: input.state,
        country: input.country,
        zipCode: input.zipCode,
        notes: input.notes,
        ownerAgentId,
        leadId: input.leadId
      }
    });
  }

  static async deleteClient(clientId: string, context: UserContext) {
    await ensureClientAccess(clientId, context);

    await prisma.client.delete({
      where: { id: clientId }
    });
  }

  static async addVisit(clientId: string, input: AddClientVisitInput, context: UserContext) {
    await ensureClientAccess(clientId, context);

    return prisma.clientPropertyVisit.create({
      data: {
        clientId,
        propertyId: input.propertyId,
        visitAt: input.visitAt,
        status: input.status,
        feedback: normalizeOptionalString(input.feedback),
        rating: input.rating,
        createdById: context.userId
      },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            city: true,
            state: true,
            listingPrice: true
          }
        }
      }
    });
  }

  static async addInteraction(clientId: string, input: AddClientInteractionInput, context: UserContext) {
    await ensureClientAccess(clientId, context);

    return prisma.activity.create({
      data: {
        clientId,
        type: input.type,
        direction: input.direction,
        subject: normalizeOptionalString(input.subject),
        description: normalizeOptionalString(input.description),
        metadata: input.metadata,
        performedAt: input.performedAt ?? new Date(),
        createdById: context.userId
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });
  }

  static async getInteractions(clientId: string, context: UserContext) {
    await ensureClientAccess(clientId, context);

    return prisma.activity.findMany({
      where: { clientId },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: {
        performedAt: "desc"
      }
    });
  }
}
