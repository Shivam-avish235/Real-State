import type { Request, Response } from "express";

import { asyncHandler } from "../../common/middleware/async-handler";
import { createSuccessResponse } from "../../common/utils/api-response";

import { WebhooksService } from "./webhooks.service";
import type {
    CreateWebhookEndpointInput,
    ListWebhookDeliveriesQueryInput,
    ListWebhookEndpointsQueryInput,
    TriggerWebhookInput,
    UpdateWebhookEndpointInput
} from "./webhooks.validation";

export const listWebhookEndpoints = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as ListWebhookEndpointsQueryInput;
  const data = await WebhooksService.listWebhookEndpoints(query, req.user!);

  res.status(200).json(createSuccessResponse("Webhook endpoints fetched", data));
});

export const createWebhookEndpoint = asyncHandler(async (req: Request, res: Response) => {
  const payload = req.body as CreateWebhookEndpointInput;
  const data = await WebhooksService.createWebhookEndpoint(payload, req.user!);

  res.status(201).json(createSuccessResponse("Webhook endpoint created", data));
});

export const getWebhookEndpointById = asyncHandler(async (req: Request, res: Response) => {
  const data = await WebhooksService.getWebhookEndpointById(req.params.id, req.user!);

  res.status(200).json(createSuccessResponse("Webhook endpoint fetched", data));
});

export const updateWebhookEndpoint = asyncHandler(async (req: Request, res: Response) => {
  const payload = req.body as UpdateWebhookEndpointInput;
  const data = await WebhooksService.updateWebhookEndpoint(req.params.id, payload, req.user!);

  res.status(200).json(createSuccessResponse("Webhook endpoint updated", data));
});

export const rotateWebhookSecret = asyncHandler(async (req: Request, res: Response) => {
  const data = await WebhooksService.rotateWebhookSecret(req.params.id, req.user!);

  res.status(200).json(createSuccessResponse("Webhook secret rotated", data));
});

export const deleteWebhookEndpoint = asyncHandler(async (req: Request, res: Response) => {
  await WebhooksService.deleteWebhookEndpoint(req.params.id, req.user!);

  res.status(200).json(createSuccessResponse("Webhook endpoint deleted", { deleted: true }));
});

export const triggerWebhook = asyncHandler(async (req: Request, res: Response) => {
  const payload = req.body as TriggerWebhookInput;
  const data = await WebhooksService.triggerWebhook(req.params.id, payload, req.user!);

  res.status(201).json(createSuccessResponse("Webhook trigger queued", data));
});

export const listWebhookDeliveries = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as ListWebhookDeliveriesQueryInput;
  const data = await WebhooksService.listWebhookDeliveries(req.params.id, query, req.user!);

  res.status(200).json(createSuccessResponse("Webhook deliveries fetched", data));
});
