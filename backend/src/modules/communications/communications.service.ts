import type { Prisma, ReminderStatus, UserRole } from "@prisma/client";
import nodemailer from "nodemailer";

import { ApiError } from "../../common/utils/api-error";
import { env } from "../../config/env";
import { prisma } from "../../config/prisma";

import type {
    CreateActivityInput,
    ListRemindersQueryInput,
    ListTimelineQueryInput,
    ScheduleReminderInput,
    SendNotificationInput
} from "./communications.validation";

type UserContext = {
  userId: string;
  role: UserRole;
};

const emailTransporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_SECURE,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS
  }
});

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

const agentActivityVisibilityFilter = (userId: string): Prisma.ActivityWhereInput => ({
  OR: [
    { createdById: userId },
    { deal: { ownerId: userId } },
    { client: { ownerAgentId: userId } },
    { lead: { assignedToId: userId } },
    { property: { ownerAgentId: userId } }
  ]
});

const agentReminderVisibilityFilter = (userId: string): Prisma.FollowUpReminderWhereInput => ({
  OR: [{ assignedToId: userId }, { createdById: userId }]
});

export class CommunicationsService {
  static async listTimeline(query: ListTimelineQueryInput, context: UserContext) {
    const { skip, take } = calculatePagination(query.page, query.limit);

    const where: Prisma.ActivityWhereInput = {
      AND: [
        context.role === "AGENT" ? agentActivityVisibilityFilter(context.userId) : undefined,
        query.leadId ? { leadId: query.leadId } : undefined,
        query.clientId ? { clientId: query.clientId } : undefined,
        query.dealId ? { dealId: query.dealId } : undefined,
        query.propertyId ? { propertyId: query.propertyId } : undefined,
        query.type ? { type: query.type } : undefined
      ].filter(Boolean) as Prisma.ActivityWhereInput[]
    };

    const [items, total] = await prisma.$transaction([
      prisma.activity.findMany({
        where,
        skip,
        take,
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
      }),
      prisma.activity.count({ where })
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

  static async createActivity(input: CreateActivityInput, context: UserContext) {
    return prisma.activity.create({
      data: {
        type: input.type,
        direction: input.direction,
        subject: normalizeOptionalString(input.subject),
        description: normalizeOptionalString(input.description),
        metadata: input.metadata,
        performedAt: input.performedAt ?? new Date(),
        leadId: normalizeOptionalString(input.leadId),
        clientId: normalizeOptionalString(input.clientId),
        dealId: normalizeOptionalString(input.dealId),
        propertyId: normalizeOptionalString(input.propertyId),
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

  static async scheduleReminder(input: ScheduleReminderInput, context: UserContext) {
    const assignedToId = context.role === "AGENT" ? context.userId : input.assignedToId ?? context.userId;

    return prisma.followUpReminder.create({
      data: {
        leadId: normalizeOptionalString(input.leadId),
        clientId: normalizeOptionalString(input.clientId),
        dealId: normalizeOptionalString(input.dealId),
        assignedToId,
        createdById: context.userId,
        title: input.title,
        description: normalizeOptionalString(input.description),
        dueAt: input.dueAt
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
  }

  static async listReminders(query: ListRemindersQueryInput, context: UserContext) {
    const { skip, take } = calculatePagination(query.page, query.limit);

    const where: Prisma.FollowUpReminderWhereInput = {
      AND: [
        context.role === "AGENT" ? agentReminderVisibilityFilter(context.userId) : undefined,
        query.status ? { status: query.status } : undefined,
        query.assignedToId && context.role !== "AGENT" ? { assignedToId: query.assignedToId } : undefined,
        query.dueBefore ? { dueAt: { lte: query.dueBefore } } : undefined,
        query.dueAfter ? { dueAt: { gte: query.dueAfter } } : undefined
      ].filter(Boolean) as Prisma.FollowUpReminderWhereInput[]
    };

    const [items, total] = await prisma.$transaction([
      prisma.followUpReminder.findMany({
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
          }
        },
        orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }]
      }),
      prisma.followUpReminder.count({ where })
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

  static async updateReminderStatus(reminderId: string, status: ReminderStatus, context: UserContext) {
    const reminder = await prisma.followUpReminder.findUnique({
      where: { id: reminderId }
    });

    if (!reminder) {
      throw new ApiError(404, "Reminder not found");
    }

    if (context.role === "AGENT" && reminder.assignedToId !== context.userId && reminder.createdById !== context.userId) {
      throw new ApiError(403, "Forbidden");
    }

    return prisma.followUpReminder.update({
      where: { id: reminderId },
      data: {
        status,
        completedAt: status === "COMPLETED" ? new Date() : null
      }
    });
  }

  static async sendNotification(input: SendNotificationInput, context: UserContext) {
    if (context.role === "AGENT" && input.recipientId !== context.userId) {
      throw new ApiError(403, "Agents can send notifications only to themselves");
    }

    const recipient = await prisma.user.findUnique({
      where: { id: input.recipientId }
    });

    if (!recipient) {
      throw new ApiError(404, "Recipient not found");
    }

    const notification = await prisma.notification.create({
      data: {
        recipientId: input.recipientId,
        type: input.type,
        channel: input.channel,
        status: "QUEUED",
        title: input.title,
        message: input.message,
        entityType: normalizeOptionalString(input.entityType),
        entityId: normalizeOptionalString(input.entityId),
        metadata: input.metadata
      }
    });

    if (input.channel === "EMAIL") {
      try {
        await emailTransporter.sendMail({
          from: env.SMTP_FROM,
          to: recipient.email,
          subject: input.title,
          text: input.message,
          html: `<p>${input.message}</p>`
        });

        return prisma.notification.update({
          where: { id: notification.id },
          data: {
            status: "SENT",
            sentAt: new Date()
          }
        });
      } catch (error) {
        return prisma.notification.update({
          where: { id: notification.id },
          data: {
            status: "FAILED",
            errorMessage: error instanceof Error ? error.message : "Failed to send email"
          }
        });
      }
    }

    return prisma.notification.update({
      where: { id: notification.id },
      data: {
        status: "SENT",
        sentAt: new Date()
      }
    });
  }
}
