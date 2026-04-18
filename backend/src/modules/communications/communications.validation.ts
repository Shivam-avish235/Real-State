import { ActivityDirection, ActivityType, NotificationChannel, NotificationType, ReminderStatus } from "@prisma/client";
import { z } from "zod";

export const reminderIdParamSchema = z.object({
  id: z.string().trim().min(1)
});

export const listTimelineQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(25),
  leadId: z.string().trim().optional(),
  clientId: z.string().trim().optional(),
  dealId: z.string().trim().optional(),
  propertyId: z.string().trim().optional(),
  type: z.nativeEnum(ActivityType).optional()
});

export const createActivitySchema = z.object({
  type: z.nativeEnum(ActivityType),
  direction: z.nativeEnum(ActivityDirection).default(ActivityDirection.INTERNAL),
  subject: z.string().trim().max(200).optional(),
  description: z.string().trim().max(4000).optional(),
  metadata: z.record(z.any()).optional(),
  performedAt: z.coerce.date().optional(),
  leadId: z.string().trim().optional(),
  clientId: z.string().trim().optional(),
  dealId: z.string().trim().optional(),
  propertyId: z.string().trim().optional()
});

export const scheduleReminderSchema = z.object({
  leadId: z.string().trim().optional(),
  clientId: z.string().trim().optional(),
  dealId: z.string().trim().optional(),
  assignedToId: z.string().trim().optional(),
  title: z.string().trim().min(2).max(200),
  description: z.string().trim().max(2000).optional(),
  dueAt: z.coerce.date()
});

export const listRemindersQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(25),
  status: z.nativeEnum(ReminderStatus).optional(),
  assignedToId: z.string().trim().optional(),
  dueBefore: z.coerce.date().optional(),
  dueAfter: z.coerce.date().optional()
});

export const sendNotificationSchema = z.object({
  recipientId: z.string().trim().min(1),
  title: z.string().trim().min(2).max(160),
  message: z.string().trim().min(2).max(4000),
  type: z.nativeEnum(NotificationType).default(NotificationType.IN_APP),
  channel: z.nativeEnum(NotificationChannel).default(NotificationChannel.IN_APP),
  entityType: z.string().trim().max(100).optional(),
  entityId: z.string().trim().max(100).optional(),
  metadata: z.record(z.any()).optional()
});

export type ListTimelineQueryInput = z.infer<typeof listTimelineQuerySchema>;
export type CreateActivityInput = z.infer<typeof createActivitySchema>;
export type ScheduleReminderInput = z.infer<typeof scheduleReminderSchema>;
export type ListRemindersQueryInput = z.infer<typeof listRemindersQuerySchema>;
export type SendNotificationInput = z.infer<typeof sendNotificationSchema>;
