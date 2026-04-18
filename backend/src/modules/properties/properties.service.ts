import type { Prisma, UserRole } from "@prisma/client";

import { ApiError } from "../../common/utils/api-error";
import { prisma } from "../../config/prisma";

import type {
    AddPropertyImageInput,
    CreatePropertyInput,
    ListPropertiesQueryInput,
    UpdatePropertyInput
} from "./properties.validation";

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

const calculatePagination = (page: number, limit: number) => {
  const safePage = page > 0 ? page : 1;
  const safeLimit = limit > 0 ? limit : 20;

  return {
    skip: (safePage - 1) * safeLimit,
    take: safeLimit
  };
};

const getAgentScopedFilter = (context: UserContext): Prisma.PropertyWhereInput | undefined => {
  if (context.role !== "AGENT") {
    return undefined;
  }

  return {
    OR: [{ ownerAgentId: context.userId }, { createdById: context.userId }]
  };
};

const ensurePropertyAccess = async (propertyId: string, context: UserContext) => {
  const property = await prisma.property.findUnique({
    where: { id: propertyId }
  });

  if (!property) {
    throw new ApiError(404, "Property not found");
  }

  if (context.role === "AGENT" && property.ownerAgentId !== context.userId && property.createdById !== context.userId) {
    throw new ApiError(403, "Forbidden");
  }

  return property;
};

const ensureAgent = async (agentId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: agentId }
  });

  if (!user) {
    throw new ApiError(404, "Owner agent not found");
  }

  if (user.status !== "ACTIVE") {
    throw new ApiError(400, "Owner agent is not active");
  }

  return user;
};

export class PropertiesService {
  static async listProperties(query: ListPropertiesQueryInput, context: UserContext) {
    const scopedFilter = getAgentScopedFilter(context);
    const search = normalizeOptionalString(query.search);

    const where: Prisma.PropertyWhereInput = {
      AND: [
        scopedFilter,
        query.type ? { type: query.type } : undefined,
        query.status ? { status: query.status } : undefined,
        query.city ? { city: { equals: query.city } } : undefined,
        query.state ? { state: { equals: query.state } } : undefined,
        query.country ? { country: { equals: query.country } } : undefined,
        query.ownerAgentId && context.role !== "AGENT" ? { ownerAgentId: query.ownerAgentId } : undefined,
        query.isFeatured === undefined ? undefined : { isFeatured: query.isFeatured },
        query.minPrice !== undefined ? { listingPrice: { gte: query.minPrice } } : undefined,
        query.maxPrice !== undefined ? { listingPrice: { lte: query.maxPrice } } : undefined,
        search
          ? {
              OR: [
                { title: { contains: search } },
                { city: { contains: search } },
                { state: { contains: search } },
                { country: { contains: search } },
                { addressLine1: { contains: search } }
              ]
            }
          : undefined
      ].filter(Boolean) as Prisma.PropertyWhereInput[]
    };

    const { skip, take } = calculatePagination(query.page, query.limit);

    const [items, total] = await prisma.$transaction([
      prisma.property.findMany({
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
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          images: {
            orderBy: {
              sortOrder: "asc"
            },
            take: 1
          },
          _count: {
            select: {
              visits: true,
              deals: true,
              activities: true
            }
          }
        },
        orderBy: {
          createdAt: "desc"
        }
      }),
      prisma.property.count({ where })
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

  static async createProperty(input: CreatePropertyInput, context: UserContext) {
    const ownerAgentId = context.role === "AGENT" ? context.userId : normalizeOptionalString(input.ownerAgentId);

    if (ownerAgentId) {
      await ensureAgent(ownerAgentId);
    }

    return prisma.property.create({
      data: {
        title: input.title,
        description: normalizeOptionalString(input.description),
        addressLine1: input.addressLine1,
        addressLine2: normalizeOptionalString(input.addressLine2),
        city: input.city,
        state: input.state,
        country: input.country,
        zipCode: normalizeOptionalString(input.zipCode),
        latitude: input.latitude,
        longitude: input.longitude,
        type: input.type,
        status: input.status,
        listingPrice: input.listingPrice,
        sizeSqft: input.sizeSqft,
        bedrooms: input.bedrooms,
        bathrooms: input.bathrooms,
        parkingSpaces: input.parkingSpaces,
        yearBuilt: input.yearBuilt,
        amenities: input.amenities,
        tags: input.tags,
        isFeatured: input.isFeatured,
        ownerAgentId,
        createdById: context.userId
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

  static async getPropertyById(propertyId: string, context: UserContext) {
    await ensurePropertyAccess(propertyId, context);

    return prisma.property.findUnique({
      where: { id: propertyId },
      include: {
        ownerAgent: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        images: {
          orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }]
        },
        visits: {
          include: {
            client: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                phone: true
              }
            }
          },
          orderBy: {
            visitAt: "desc"
          },
          take: 20
        }
      }
    });
  }

  static async updateProperty(propertyId: string, input: UpdatePropertyInput, context: UserContext) {
    await ensurePropertyAccess(propertyId, context);

    const ownerAgentId = context.role === "AGENT" ? context.userId : normalizeOptionalString(input.ownerAgentId);

    if (ownerAgentId) {
      await ensureAgent(ownerAgentId);
    }

    return prisma.property.update({
      where: { id: propertyId },
      data: {
        title: input.title,
        description: normalizeOptionalString(input.description),
        addressLine1: input.addressLine1,
        addressLine2: normalizeOptionalString(input.addressLine2),
        city: input.city,
        state: input.state,
        country: input.country,
        zipCode: normalizeOptionalString(input.zipCode),
        latitude: input.latitude,
        longitude: input.longitude,
        type: input.type,
        status: input.status,
        listingPrice: input.listingPrice,
        sizeSqft: input.sizeSqft,
        bedrooms: input.bedrooms,
        bathrooms: input.bathrooms,
        parkingSpaces: input.parkingSpaces,
        yearBuilt: input.yearBuilt,
        amenities: input.amenities,
        tags: input.tags,
        isFeatured: input.isFeatured,
        ownerAgentId
      }
    });
  }

  static async deleteProperty(propertyId: string, context: UserContext) {
    await ensurePropertyAccess(propertyId, context);

    await prisma.property.delete({
      where: { id: propertyId }
    });
  }

  static async listPropertyImages(propertyId: string, context: UserContext) {
    await ensurePropertyAccess(propertyId, context);

    return prisma.propertyImage.findMany({
      where: { propertyId },
      orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }]
    });
  }

  static async addPropertyImage(propertyId: string, input: AddPropertyImageInput, context: UserContext) {
    await ensurePropertyAccess(propertyId, context);

    if (input.isPrimary) {
      await prisma.propertyImage.updateMany({
        where: { propertyId },
        data: { isPrimary: false }
      });
    }

    return prisma.propertyImage.create({
      data: {
        propertyId,
        url: input.url,
        publicId: input.publicId,
        caption: normalizeOptionalString(input.caption),
        isPrimary: input.isPrimary,
        sortOrder: input.sortOrder
      }
    });
  }
}
