import type { DealStage, Prisma, UserRole } from "@prisma/client";

import { ApiError } from "../../common/utils/api-error";
import { prisma } from "../../config/prisma";

import type {
    AddDealDocumentInput,
    CreateDealInput,
    ListDealsQueryInput,
    MoveDealStageInput,
    UpdateDealInput
} from "./deals.validation";

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

const getScopedDealFilter = (context: UserContext): Prisma.DealWhereInput | undefined => {
  if (context.role !== "AGENT") {
    return undefined;
  }

  return {
    ownerId: context.userId
  };
};

const ensureDealAccess = async (dealId: string, context: UserContext) => {
  const deal = await prisma.deal.findUnique({
    where: { id: dealId }
  });

  if (!deal) {
    throw new ApiError(404, "Deal not found");
  }

  if (context.role === "AGENT" && deal.ownerId !== context.userId) {
    throw new ApiError(403, "Forbidden");
  }

  return deal;
};

const calculateCommissionAmount = (dealValue: number, commissionRate?: number | null, commissionAmount?: number | null) => {
  if (commissionAmount !== null && commissionAmount !== undefined) {
    return commissionAmount;
  }

  if (commissionRate !== null && commissionRate !== undefined) {
    return Number(((dealValue * commissionRate) / 100).toFixed(2));
  }

  return undefined;
};

const calculatePagination = (page: number, limit: number) => {
  const safePage = page > 0 ? page : 1;
  const safeLimit = limit > 0 ? limit : 20;

  return {
    skip: (safePage - 1) * safeLimit,
    take: safeLimit
  };
};

export class DealsService {
  static async listDeals(query: ListDealsQueryInput, context: UserContext) {
    const scopedFilter = getScopedDealFilter(context);

    const where: Prisma.DealWhereInput = {
      AND: [
        scopedFilter,
        query.stage ? { stage: query.stage } : undefined,
        query.status ? { status: query.status } : undefined,
        query.ownerId && context.role !== "AGENT" ? { ownerId: query.ownerId } : undefined,
        query.clientId ? { clientId: query.clientId } : undefined,
        query.leadId ? { leadId: query.leadId } : undefined,
        query.search
          ? {
              OR: [
                { title: { contains: query.search } },
                { description: { contains: query.search } },
                { client: { firstName: { contains: query.search } } },
                { client: { lastName: { contains: query.search } } }
              ]
            }
          : undefined
      ].filter(Boolean) as Prisma.DealWhereInput[]
    };

    const { skip, take } = calculatePagination(query.page, query.limit);

    const [items, total] = await prisma.$transaction([
      prisma.deal.findMany({
        where,
        skip,
        take,
        include: {
          client: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              type: true,
              phone: true
            }
          },
          owner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          property: {
            select: {
              id: true,
              title: true,
              city: true,
              listingPrice: true
            }
          },
          _count: {
            select: {
              documents: true,
              activities: true
            }
          }
        },
        orderBy: {
          updatedAt: "desc"
        }
      }),
      prisma.deal.count({ where })
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

  static async getPipeline(context: UserContext) {
    const where = getScopedDealFilter(context);

    const deals = await prisma.deal.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: {
        updatedAt: "desc"
      }
    });

    const stageOrder: DealStage[] = ["INQUIRY", "NEGOTIATION", "AGREEMENT", "CLOSED", "LOST"];

    return stageOrder.map((stage) => {
      const stageDeals = deals.filter((deal) => deal.stage === stage);

      return {
        stage,
        count: stageDeals.length,
        totalValue: stageDeals.reduce((sum, deal) => sum + Number(deal.dealValue), 0),
        items: stageDeals
      };
    });
  }

  static async createDeal(input: CreateDealInput, context: UserContext) {
    const ownerId = context.role === "AGENT" ? context.userId : input.ownerId ?? context.userId;
    const commissionAmount = calculateCommissionAmount(input.dealValue, input.commissionRate, input.commissionAmount);

    const deal = await prisma.deal.create({
      data: {
        title: input.title,
        description: normalizeOptionalString(input.description),
        stage: input.stage,
        status: input.status,
        expectedCloseDate: input.expectedCloseDate,
        closeDate: input.closeDate,
        dealValue: input.dealValue,
        commissionRate: input.commissionRate,
        commissionAmount,
        commissionPaid: input.commissionPaid,
        currency: input.currency,
        clientId: input.clientId,
        propertyId: normalizeOptionalString(input.propertyId),
        leadId: normalizeOptionalString(input.leadId),
        ownerId,
        createdById: context.userId,
        stageHistory: {
          create: {
            toStage: input.stage,
            changedById: context.userId,
            note: "Deal created"
          }
        }
      },
      include: {
        client: true,
        owner: true,
        property: true
      }
    });

    return deal;
  }

  static async getDealById(dealId: string, context: UserContext) {
    await ensureDealAccess(dealId, context);

    return prisma.deal.findUnique({
      where: { id: dealId },
      include: {
        client: true,
        owner: {
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
        property: true,
        lead: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            status: true
          }
        },
        documents: {
          orderBy: {
            uploadedAt: "desc"
          }
        },
        stageHistory: {
          include: {
            changedBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          },
          orderBy: {
            createdAt: "desc"
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
          }
        }
      }
    });
  }

  static async updateDeal(dealId: string, input: UpdateDealInput, context: UserContext) {
    const current = await ensureDealAccess(dealId, context);
    const nextOwnerId = context.role === "AGENT" ? context.userId : input.ownerId ?? current.ownerId;

    const dealValue = input.dealValue ?? Number(current.dealValue);
    const commissionRate = input.commissionRate ?? (current.commissionRate ? Number(current.commissionRate) : undefined);
    const commissionAmount = calculateCommissionAmount(
      dealValue,
      commissionRate,
      input.commissionAmount ?? (current.commissionAmount ? Number(current.commissionAmount) : undefined)
    );

    const updated = await prisma.deal.update({
      where: { id: dealId },
      data: {
        title: input.title,
        description: input.description,
        stage: input.stage,
        status: input.status,
        expectedCloseDate: input.expectedCloseDate,
        closeDate: input.closeDate,
        dealValue: input.dealValue,
        commissionRate: input.commissionRate,
        commissionAmount,
        commissionPaid: input.commissionPaid,
        currency: input.currency,
        clientId: input.clientId,
        propertyId: input.propertyId,
        leadId: input.leadId,
        ownerId: nextOwnerId
      }
    });

    if (input.stage && input.stage !== current.stage) {
      await prisma.dealStageHistory.create({
        data: {
          dealId: updated.id,
          fromStage: current.stage,
          toStage: input.stage,
          changedById: context.userId,
          note: "Stage changed during update"
        }
      });
    }

    return updated;
  }

  static async moveStage(dealId: string, input: MoveDealStageInput, context: UserContext) {
    const current = await ensureDealAccess(dealId, context);

    if (current.stage === input.toStage) {
      throw new ApiError(400, "Deal already in this stage");
    }

    const updated = await prisma.deal.update({
      where: { id: dealId },
      data: {
        stage: input.toStage,
        status: input.toStage === "CLOSED" ? "WON" : input.toStage === "LOST" ? "LOST" : current.status
      }
    });

    await prisma.dealStageHistory.create({
      data: {
        dealId,
        fromStage: current.stage,
        toStage: input.toStage,
        changedById: context.userId,
        note: normalizeOptionalString(input.note)
      }
    });

    return updated;
  }

  static async addDocument(dealId: string, input: AddDealDocumentInput, context: UserContext) {
    await ensureDealAccess(dealId, context);

    return prisma.dealDocument.create({
      data: {
        dealId,
        type: input.type,
        fileName: input.fileName,
        mimeType: input.mimeType,
        sizeBytes: input.sizeBytes,
        url: input.url,
        publicId: normalizeOptionalString(input.publicId),
        notes: normalizeOptionalString(input.notes),
        expiresAt: input.expiresAt,
        uploadedById: context.userId
      }
    });
  }

  static async listDocuments(dealId: string, context: UserContext) {
    await ensureDealAccess(dealId, context);

    return prisma.dealDocument.findMany({
      where: { dealId },
      include: {
        uploadedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: {
        uploadedAt: "desc"
      }
    });
  }

  static async deleteDeal(dealId: string, context: UserContext) {
    await ensureDealAccess(dealId, context);

    await prisma.deal.delete({
      where: { id: dealId }
    });
  }
}
