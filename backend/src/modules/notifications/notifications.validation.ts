import { NotificationChannel, NotificationStatus, NotificationType } from "@prisma/client";
import { z } from "zod";

export const listNotificationsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  type: z.nativeEnum(NotificationType).optional(),
  channel: z.nativeEnum(NotificationChannel).optional(),
  status: z.nativeEnum(NotificationStatus).optional(),
  recipientId: z.string().trim().optional()
});

export const notificationIdParamSchema = z.object({
  id: z.string().trim().min(1)
});

export const createNotificationSchema = z.object({
  recipientId: z.string().trim().min(1),
  type: z.nativeEnum(NotificationType),
  channel: z.nativeEnum(NotificationChannel).default(NotificationChannel.IN_APP),
  status: z.nativeEnum(NotificationStatus).default(NotificationStatus.QUEUED),
  title: z.string().trim().min(2).max(160),
  message: z.string().trim().min(2).max(2000),
  entityType: z.string().trim().max(100).optional(),
  entityId: z.string().trim().max(120).optional(),
  metadata: z.record(z.any()).optional(),
  errorMessage: z.string().trim().max(2000).optional()
});

export const markAllReadSchema = z.object({
  recipientId: z.string().trim().optional()
});

export type ListNotificationsQueryInput = z.infer<typeof listNotificationsQuerySchema>;
export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;
export type MarkAllReadInput = z.infer<typeof markAllReadSchema>;
