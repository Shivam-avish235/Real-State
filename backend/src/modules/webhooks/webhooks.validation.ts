import { WebhookDeliveryStatus, WebhookEventType } from "@prisma/client";
import { z } from "zod";

export const listWebhookEndpointsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  isActive: z.coerce.boolean().optional(),
  search: z.string().trim().optional()
});

export const webhookIdParamSchema = z.object({
  id: z.string().trim().min(1)
});

export const webhookDeliveryParamsSchema = z.object({
  id: z.string().trim().min(1),
  deliveryId: z.string().trim().min(1)
});

export const createWebhookEndpointSchema = z.object({
  name: z.string().trim().min(2).max(120),
  url: z.string().trim().url(),
  events: z.array(z.nativeEnum(WebhookEventType)).min(1),
  secret: z.string().trim().min(12).max(200).optional(),
  isActive: z.coerce.boolean().default(true)
});

export const updateWebhookEndpointSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  url: z.string().trim().url().optional(),
  events: z.array(z.nativeEnum(WebhookEventType)).min(1).optional(),
  secret: z.string().trim().min(12).max(200).optional(),
  isActive: z.coerce.boolean().optional()
});

export const triggerWebhookSchema = z.object({
  eventType: z.nativeEnum(WebhookEventType),
  payload: z.record(z.any())
});

export const listWebhookDeliveriesQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z.nativeEnum(WebhookDeliveryStatus).optional()
});

export type ListWebhookEndpointsQueryInput = z.infer<typeof listWebhookEndpointsQuerySchema>;
export type CreateWebhookEndpointInput = z.infer<typeof createWebhookEndpointSchema>;
export type UpdateWebhookEndpointInput = z.infer<typeof updateWebhookEndpointSchema>;
export type TriggerWebhookInput = z.infer<typeof triggerWebhookSchema>;
export type ListWebhookDeliveriesQueryInput = z.infer<typeof listWebhookDeliveriesQuerySchema>;
