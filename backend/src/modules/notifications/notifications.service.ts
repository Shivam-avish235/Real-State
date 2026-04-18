import { NotificationStatus, type Prisma, type UserRole } from "@prisma/client";

import { ApiError } from "../../common/utils/api-error";
import { prisma } from "../../config/prisma";

import type {
    CreateNotificationInput,
    ListNotificationsQueryInput,
    MarkAllReadInput
} from "./notifications.validation";

type UserContext = {
  userId: string;
  role: UserRole;
};

const calculatePagination = (page: number, limit: number) => {
  const safePage = page > 0 ? page : 1;
  const safeLimit = limit > 0 ? limit : 20;

  return {
    skip: (safePage - 1) * safeLimit,
    take: safeLimit
  };
};

const resolveTargetRecipientId = (context: UserContext, recipientIdFromQuery?: string): string => {
  if (context.role === "ADMIN" || context.role === "MANAGER") {
    return recipientIdFromQuery ?? context.userId;
  }

  return context.userId;
};

const ensureRecipientScope = async (recipientId: string, context: UserContext) => {
  if (context.role === "ADMIN") {
    return;
  }

  if (context.role === "AGENT") {
    if (recipientId !== context.userId) {
      throw new ApiError(403, "Forbidden");
    }

    return;
  }

  if (recipientId === context.userId) {
    return;
  }

  const teamMember = await prisma.user.findUnique({
    where: { id: recipientId }
  });

  if (!teamMember || teamMember.managerId !== context.userId) {
    throw new ApiError(403, "Forbidden");
  }
};

const ensureNotificationAccess = async (notificationId: string, context: UserContext) => {
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId }
  });

  if (!notification) {
    throw new ApiError(404, "Notification not found");
  }

  await ensureRecipientScope(notification.recipientId, context);

  return notification;
};

export class NotificationsService {
  static async listNotifications(query: ListNotificationsQueryInput, context: UserContext) {
    const targetRecipientId = resolveTargetRecipientId(context, query.recipientId);
    await ensureRecipientScope(targetRecipientId, context);

    const where: Prisma.NotificationWhereInput = {
      AND: [
        { recipientId: targetRecipientId },
        query.type ? { type: query.type } : undefined,
        query.channel ? { channel: query.channel } : undefined,
        query.status ? { status: query.status } : undefined
      ].filter(Boolean) as Prisma.NotificationWhereInput[]
    };

    const { skip, take } = calculatePagination(query.page, query.limit);

    const [items, total, unreadCount] = await prisma.$transaction([
      prisma.notification.findMany({
        where,
        skip,
        take,
        include: {
          recipient: {
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
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({
        where: {
          recipientId: targetRecipientId,
          status: {
            not: NotificationStatus.READ
          }
        }
      })
    ]);

    return {
      items,
      unreadCount,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit)
      }
    };
  }

  static async createNotification(input: CreateNotificationInput, context: UserContext) {
    if (context.role === "AGENT") {
      throw new ApiError(403, "Forbidden");
    }

    await ensureRecipientScope(input.recipientId, context);

    const target = await prisma.user.findUnique({
      where: { id: input.recipientId }
    });

    if (!target || target.deletedAt) {
      throw new ApiError(404, "Target user not found");
    }

    return prisma.notification.create({
      data: {
        recipientId: input.recipientId,
        type: input.type,
        channel: input.channel,
        status: input.status,
        title: input.title,
        message: input.message,
        entityType: input.entityType,
        entityId: input.entityId,
        sentAt: input.status === NotificationStatus.SENT ? new Date() : null,
        readAt: input.status === NotificationStatus.READ ? new Date() : null,
        errorMessage: input.errorMessage,
        metadata: input.metadata,
      },
      include: {
        recipient: {
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

  static async getNotificationById(notificationId: string, context: UserContext) {
    await ensureNotificationAccess(notificationId, context);

    return prisma.notification.findUnique({
      where: { id: notificationId },
      include: {
        recipient: {
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

  static async markNotificationRead(notificationId: string, context: UserContext) {
    await ensureNotificationAccess(notificationId, context);

    return prisma.notification.update({
      where: { id: notificationId },
      data: {
        status: NotificationStatus.READ,
        readAt: new Date()
      }
    });
  }

  static async markAllRead(input: MarkAllReadInput, context: UserContext) {
    const targetRecipientId = resolveTargetRecipientId(context, input.recipientId);
    await ensureRecipientScope(targetRecipientId, context);

    const result = await prisma.notification.updateMany({
      where: {
        recipientId: targetRecipientId,
        status: {
          not: NotificationStatus.READ
        }
      },
      data: {
        status: NotificationStatus.READ,
        readAt: new Date()
      }
    });

    return {
      updatedCount: result.count,
      recipientId: targetRecipientId
    };
  }

  static async deleteNotification(notificationId: string, context: UserContext) {
    await ensureNotificationAccess(notificationId, context);

    await prisma.notification.delete({
      where: { id: notificationId }
    });
  }
}
