import { Router } from "express";

import { authGuard } from "../../common/middleware/auth-guard";
import { validateRequest } from "../../common/middleware/validate-request";

import {
    createWebhookEndpoint,
    deleteWebhookEndpoint,
    getWebhookEndpointById,
    listWebhookDeliveries,
    listWebhookEndpoints,
    rotateWebhookSecret,
    triggerWebhook,
    updateWebhookEndpoint
} from "./webhooks.controller";
import {
    createWebhookEndpointSchema,
    listWebhookDeliveriesQuerySchema,
    listWebhookEndpointsQuerySchema,
    triggerWebhookSchema,
    updateWebhookEndpointSchema,
    webhookIdParamSchema
} from "./webhooks.validation";

const webhooksRouter = Router();

webhooksRouter.use(authGuard);

webhooksRouter.get("/", validateRequest({ query: listWebhookEndpointsQuerySchema }), listWebhookEndpoints);
webhooksRouter.post("/", validateRequest({ body: createWebhookEndpointSchema }), createWebhookEndpoint);
webhooksRouter.get("/:id", validateRequest({ params: webhookIdParamSchema }), getWebhookEndpointById);
webhooksRouter.patch("/:id", validateRequest({ params: webhookIdParamSchema, body: updateWebhookEndpointSchema }), updateWebhookEndpoint);
webhooksRouter.delete("/:id", validateRequest({ params: webhookIdParamSchema }), deleteWebhookEndpoint);
webhooksRouter.post("/:id/rotate-secret", validateRequest({ params: webhookIdParamSchema }), rotateWebhookSecret);
webhooksRouter.post("/:id/trigger", validateRequest({ params: webhookIdParamSchema, body: triggerWebhookSchema }), triggerWebhook);
webhooksRouter.get(
  "/:id/deliveries",
  validateRequest({ params: webhookIdParamSchema, query: listWebhookDeliveriesQuerySchema }),
  listWebhookDeliveries
);

export { webhooksRouter };
