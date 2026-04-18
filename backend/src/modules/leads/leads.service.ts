import { ActivityDirection, ActivityType, LeadStatus, Prisma, type UserRole } from "@prisma/client";

import { ApiError } from "../../common/utils/api-error";
import { prisma } from "../../config/prisma";

import type {
    AssignLeadInput,
    ConvertLeadInput,
    CreateLeadInput,
    ListLeadsQueryInput,
    UpdateLeadInput
} from "./leads.validation";

type UserContext = {
  userId: string;
  role: UserRole;
};

const normalizeOptionalString = (value?: string | null): string | undefined => {
  if (value === undefined || value === null) {
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

const getAgentScopedFilter = (context: UserContext): Prisma.LeadWhereInput | undefined => {
  if (context.role !== "AGENT") {
    return undefined;
  }

  return {
    OR: [{ assignedToId: context.userId }, { createdById: context.userId }]
  };
};

const ensureLeadAccess = async (leadId: string, context: UserContext) => {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId }
  });

  if (!lead) {
    throw new ApiError(404, "Lead not found");
  }

  if (context.role === "AGENT" && lead.assignedToId !== context.userId && lead.createdById !== context.userId) {
    throw new ApiError(403, "Forbidden");
  }

  return lead;
};

const ensureAssignableAgent = async (agentId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: agentId }
  });

  if (!user) {
    throw new ApiError(404, "Agent not found");
  }

  if (user.status !== "ACTIVE") {
    throw new ApiError(400, "Selected agent is not active");
  }

  return user;
};

const buildFullName = (firstName: string, lastName?: string): string => {
  const value = `${firstName} ${lastName ?? ""}`.trim();
  return value.length > 0 ? value : firstName;
};

export class LeadsService {
  static async listLeads(query: ListLeadsQueryInput, context: UserContext) {
    const scopedFilter = getAgentScopedFilter(context);
    const search = normalizeOptionalString(query.search);

    const where: Prisma.LeadWhereInput = {
      AND: [
        scopedFilter,
        query.status ? { status: query.status } : undefined,
        query.source ? { source: query.source } : undefined,
        query.assignedToId && context.role !== "AGENT" ? { assignedToId: query.assignedToId } : undefined,
        query.createdById && context.role !== "AGENT" ? { createdById: query.createdById } : undefined,
        query.isApiLead === undefined ? undefined : { isApiLead: query.isApiLead },
        search
          ? {
              OR: [
                { firstName: { contains: search } },
                { lastName: { contains: search } },
                { fullName: { contains: search } },
                { phone: { contains: search } },
                { email: { contains: search } },
                { externalRef: { contains: search } }
              ]
            }
          : undefined
      ].filter(Boolean) as Prisma.LeadWhereInput[]
    };

    const { skip, take } = calculatePagination(query.page, query.limit);

    const [items, total] = await prisma.$transaction([
      prisma.lead.findMany({
        where,
        skip,
        take,
        include: {
          assignedTo: {
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
          _count: {
            select: {
              activities: true,
              deals: true,
              reminders: true,
              assignments: true
            }
          }
        },
        orderBy: {
          createdAt: "desc"
        }
      }),
      prisma.lead.count({ where })
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

  static async createLead(input: CreateLeadInput, context: UserContext) {
    const assignedToId = context.role === "AGENT" ? context.userId : normalizeOptionalString(input.assignedToId);

    if (assignedToId) {
      await ensureAssignableAgent(assignedToId);
    }

    return prisma.lead.create({
      data: {
        firstName: input.firstName,
        lastName: normalizeOptionalString(input.lastName),
        fullName: buildFullName(input.firstName, input.lastName),
        email: normalizeOptionalString(input.email),
        phone: input.phone,
        alternatePhone: normalizeOptionalString(input.alternatePhone),
        budgetMin: input.budgetMin,
        budgetMax: input.budgetMax,
        preferredLocations: input.preferredLocations,
        preferences: input.preferences,
        source: input.source,
        sourceDetails: normalizeOptionalString(input.sourceDetails),
        status: input.status,
        score: input.score,
        notes: normalizeOptionalString(input.notes),
        assignedToId,
        createdById: context.userId,
        nextFollowUpAt: input.nextFollowUpAt,
        externalRef: normalizeOptionalString(input.externalRef)
      },
      include: {
        assignedTo: {
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

  static async getLeadById(leadId: string, context: UserContext) {
    await ensureLeadAccess(leadId, context);

    return prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        assignedTo: {
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
        assignments: {
          include: {
            agent: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            },
            assignedBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            },
            rule: {
              select: {
                id: true,
                name: true
              }
            }
          },
          orderBy: {
            createdAt: "desc"
          }
        },
        activities: {
          orderBy: {
            performedAt: "desc"
          },
          take: 30
        },
        deals: {
          select: {
            id: true,
            title: true,
            stage: true,
            status: true,
            dealValue: true,
            createdAt: true
          },
          orderBy: {
            createdAt: "desc"
          }
        },
        reminders: {
          orderBy: {
            dueAt: "asc"
          },
          take: 20
        }
      }
    });
  }

  static async updateLead(leadId: string, input: UpdateLeadInput, context: UserContext) {
    await ensureLeadAccess(leadId, context);

    const assignedToId = context.role === "AGENT" ? context.userId : normalizeOptionalString(input.assignedToId);

    if (assignedToId) {
      await ensureAssignableAgent(assignedToId);
    }

    const nextLastName = normalizeOptionalString(input.lastName);
    const nextFirstName = normalizeOptionalString(input.firstName);

    return prisma.lead.update({
      where: { id: leadId },
      data: {
        firstName: input.firstName,
        lastName: nextLastName,
        fullName: nextFirstName ? buildFullName(nextFirstName, nextLastName) : undefined,
        email: normalizeOptionalString(input.email),
        phone: input.phone,
        alternatePhone: normalizeOptionalString(input.alternatePhone),
        budgetMin: input.budgetMin,
        budgetMax: input.budgetMax,
        preferredLocations: input.preferredLocations,
        preferences: input.preferences,
        source: input.source,
        sourceDetails: normalizeOptionalString(input.sourceDetails),
        status: input.status,
        score: input.score,
        notes: normalizeOptionalString(input.notes),
        assignedToId,
        nextFollowUpAt: input.nextFollowUpAt,
        externalRef: normalizeOptionalString(input.externalRef),
        lastContactedAt: input.status && input.status !== LeadStatus.NEW ? new Date() : undefined
      }
    });
  }

  static async deleteLead(leadId: string, context: UserContext) {
    await ensureLeadAccess(leadId, context);

    await prisma.lead.delete({
      where: { id: leadId }
    });
  }

  static async assignLead(leadId: string, input: AssignLeadInput, context: UserContext) {
    const lead = await ensureLeadAccess(leadId, context);

    if (context.role === "AGENT") {
      throw new ApiError(403, "Forbidden");
    }

    await ensureAssignableAgent(input.agentId);

    const result = await prisma.$transaction(async (tx) => {
      const updatedLead = await tx.lead.update({
        where: { id: leadId },
        data: {
          assignedToId: input.agentId,
          status: lead.status === LeadStatus.NEW ? LeadStatus.CONTACTED : lead.status
        },
        include: {
          assignedTo: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });

      const assignment = await tx.leadAssignment.create({
        data: {
          leadId,
          agentId: input.agentId,
          assignedById: context.userId,
          ruleId: normalizeOptionalString(input.ruleId),
          reason: normalizeOptionalString(input.reason)
        }
      });

      await tx.activity.create({
        data: {
          type: ActivityType.STATUS_CHANGE,
          direction: ActivityDirection.INTERNAL,
          subject: "Lead reassigned",
          description: `Lead reassigned to agent ${input.agentId}`,
          createdById: context.userId,
          leadId
        }
      });

      return {
        lead: updatedLead,
        assignment
      };
    });

    return result;
  }

  static async convertLeadToClient(leadId: string, input: ConvertLeadInput, context: UserContext) {
    const lead = await ensureLeadAccess(leadId, context);

    const existingClient = await prisma.client.findUnique({
      where: { leadId }
    });

    if (existingClient) {
      throw new ApiError(409, "Lead already converted to a client");
    }

    const ownerAgentId =
      context.role === "AGENT"
        ? context.userId
        : normalizeOptionalString(input.ownerAgentId) ?? normalizeOptionalString(lead.assignedToId) ?? context.userId;

    if (ownerAgentId) {
      await ensureAssignableAgent(ownerAgentId);
    }

    const result = await prisma.$transaction(async (tx) => {
      const client = await tx.client.create({
        data: {
          type: input.clientType,
          firstName: lead.firstName,
          lastName: lead.lastName,
          email: lead.email,
          phone: lead.phone,
          alternatePhone: lead.alternatePhone,
          budgetMin: lead.budgetMin,
          budgetMax: lead.budgetMax,
          preferences:
            lead.preferences === null ? Prisma.JsonNull : (lead.preferences as Prisma.InputJsonValue | undefined),
          notes: normalizeOptionalString(input.notes) ?? lead.notes,
          ownerAgentId,
          leadId
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

      await tx.lead.update({
        where: { id: leadId },
        data: {
          status: LeadStatus.CLOSED,
          lastContactedAt: new Date()
        }
      });

      await tx.activity.create({
        data: {
          type: ActivityType.STATUS_CHANGE,
          direction: ActivityDirection.INTERNAL,
          subject: "Lead converted",
          description: `Lead converted to client ${client.id}`,
          createdById: context.userId,
          leadId,
          clientId: client.id
        }
      });

      return client;
    });

    return result;
  }
}
