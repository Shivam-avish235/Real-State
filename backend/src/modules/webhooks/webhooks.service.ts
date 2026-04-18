import crypto from "node:crypto";

import { WebhookDeliveryStatus, type Prisma, type UserRole, type WebhookEventType } from "@prisma/client";

import { ApiError } from "../../common/utils/api-error";
import { prisma } from "../../config/prisma";

import type {
    CreateWebhookEndpointInput,
    ListWebhookDeliveriesQueryInput,
    ListWebhookEndpointsQueryInput,
    TriggerWebhookInput,
    UpdateWebhookEndpointInput
} from "./webhooks.validation";

type UserContext = {
  userId: string;
  role: UserRole;
};

type EndpointWithSecret = {
  id: string;
  url: string;
  secret: string;
  events: Prisma.JsonValue;
};

const endpointSelect = {
  id: true,
  name: true,
  url: true,
  isActive: true,
  events: true,
  failureCount: true,
  lastTriggeredAt: true,
  createdById: true,
  createdAt: true,
  updatedAt: true,
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
      deliveries: true
    }
  }
} satisfies Prisma.WebhookEndpointSelect;

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

const endpointAccessFilter = (context: UserContext): Prisma.WebhookEndpointWhereInput | undefined => {
  if (context.role === "ADMIN" || context.role === "MANAGER") {
    return undefined;
  }

  return {
    createdById: context.userId
  };
};

const ensureEndpointAccess = async (endpointId: string, context: UserContext) => {
  const endpoint = await prisma.webhookEndpoint.findUnique({
    where: { id: endpointId }
  });

  if (!endpoint) {
    throw new ApiError(404, "Webhook endpoint not found");
  }

  if (context.role === "AGENT" && endpoint.createdById !== context.userId) {
    throw new ApiError(403, "Forbidden");
  }

  return endpoint;
};

const generateWebhookSecret = () => {
  return `whsec_${crypto.randomBytes(24).toString("hex")}`;
};

const supportsEvent = (eventsValue: Prisma.JsonValue, eventType: WebhookEventType): boolean => {
  if (!Array.isArray(eventsValue)) {
    return false;
  }

  return eventsValue.some((item) => item === eventType);
};

const signPayload = (secret: string, body: string): string => {
  return crypto.createHmac("sha256", secret).update(body).digest("hex");
};

const dispatchDelivery = async (
  endpoint: EndpointWithSecret,
  eventType: WebhookEventType,
  payload: Prisma.InputJsonValue,
  deliveredById: string,
  attemptCount: number
) => {
  const requestBody = JSON.stringify({
    eventType,
    payload,
    sentAt: new Date().toISOString()
  });

  const signature = signPayload(endpoint.secret, requestBody);

  let status: WebhookDeliveryStatus = WebhookDeliveryStatus.FAILED;
  let responseCode: number | null = null;
  let responseBody: string | null = null;

  try {
    const response = await fetch(endpoint.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Event": eventType,
        "X-Webhook-Signature": signature
      },
      body: requestBody,
      signal: AbortSignal.timeout(5000)
    });

    responseCode = response.status;
    responseBody = await response.text();
    status = response.ok ? WebhookDeliveryStatus.SUCCESS : WebhookDeliveryStatus.FAILED;
  } catch (error) {
    responseBody = error instanceof Error ? error.message : "Webhook delivery failed";
  }

  const shouldRetry = status === WebhookDeliveryStatus.FAILED && attemptCount < 3;

  const delivery = await prisma.webhookDelivery.create({
    data: {
      endpointId: endpoint.id,
      eventType,
      payload,
      status,
      responseCode,
      responseBody,
      attemptCount,
      nextRetryAt: shouldRetry ? new Date(Date.now() + 60_000) : null,
      deliveredById,
      deliveredAt: status === WebhookDeliveryStatus.SUCCESS ? new Date() : null,
    }
  });

  await prisma.webhookEndpoint.update({
    where: { id: endpoint.id },
    data: {
      lastTriggeredAt: new Date(),
      failureCount: status === WebhookDeliveryStatus.FAILED ? { increment: 1 } : 0
    }
  });

  return delivery;
};

export class WebhooksService {
  static async listWebhookEndpoints(query: ListWebhookEndpointsQueryInput, context: UserContext) {
    const scopedFilter = endpointAccessFilter(context);
    const search = normalizeOptionalString(query.search);

    const where: Prisma.WebhookEndpointWhereInput = {
      AND: [
        scopedFilter,
        query.isActive === undefined ? undefined : { isActive: query.isActive },
        search ? { OR: [{ name: { contains: search } }, { url: { contains: search } }] } : undefined
      ].filter(Boolean) as Prisma.WebhookEndpointWhereInput[]
    };

    const { skip, take } = calculatePagination(query.page, query.limit);

    const [items, total] = await prisma.$transaction([
      prisma.webhookEndpoint.findMany({
        where,
        skip,
        take,
        select: endpointSelect,
        orderBy: {
          createdAt: "desc"
        }
      }),
      prisma.webhookEndpoint.count({ where })
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

  static async createWebhookEndpoint(input: CreateWebhookEndpointInput, context: UserContext) {
    const secret = normalizeOptionalString(input.secret) ?? generateWebhookSecret();

    const created = await prisma.webhookEndpoint.create({
      data: {
        name: input.name,
        url: input.url,
        secret,
        events: input.events as Prisma.InputJsonValue,
        isActive: input.isActive,
        createdById: context.userId
      },
      select: {
        ...endpointSelect,
        secret: true
      }
    });

    const { secret: createdSecret, ...endpoint } = created;

    return {
      endpoint,
      secret: createdSecret
    };
  }

  static async getWebhookEndpointById(endpointId: string, context: UserContext) {
    await ensureEndpointAccess(endpointId, context);

    return prisma.webhookEndpoint.findUnique({
      where: { id: endpointId },
      select: {
        ...endpointSelect,
        deliveries: {
          orderBy: {
            createdAt: "desc"
          },
          take: 20
        }
      }
    });
  }

  static async updateWebhookEndpoint(endpointId: string, input: UpdateWebhookEndpointInput, context: UserContext) {
    await ensureEndpointAccess(endpointId, context);

    return prisma.webhookEndpoint.update({
      where: { id: endpointId },
      data: {
        name: input.name,
        url: input.url,
        events: input.events as Prisma.InputJsonValue | undefined,
        secret: normalizeOptionalString(input.secret),
        isActive: input.isActive
      },
      select: endpointSelect
    });
  }

  static async rotateWebhookSecret(endpointId: string, context: UserContext) {
    await ensureEndpointAccess(endpointId, context);

    const secret = generateWebhookSecret();

    const updated = await prisma.webhookEndpoint.update({
      where: { id: endpointId },
      data: {
        secret
      },
      select: endpointSelect
    });

    return {
      endpoint: updated,
      secret
    };
  }

  static async deleteWebhookEndpoint(endpointId: string, context: UserContext) {
    await ensureEndpointAccess(endpointId, context);

    await prisma.webhookEndpoint.delete({
      where: { id: endpointId }
    });
  }

  static async triggerWebhook(endpointId: string, input: TriggerWebhookInput, context: UserContext) {
    const endpoint = await ensureEndpointAccess(endpointId, context);

    if (!endpoint.isActive) {
      throw new ApiError(400, "Webhook endpoint is inactive");
    }

    const endpointWithSecret: EndpointWithSecret = {
      id: endpoint.id,
      url: endpoint.url,
      secret: endpoint.secret,
      events: endpoint.events
    };

    if (!supportsEvent(endpoint.events, input.eventType)) {
      throw new ApiError(400, "Webhook endpoint is not subscribed to this event");
    }

    const delivery = await dispatchDelivery(
      endpointWithSecret,
      input.eventType,
      input.payload as Prisma.InputJsonValue,
      context.userId,
      1
    );

    return delivery;
  }

  static async listWebhookDeliveries(endpointId: string, query: ListWebhookDeliveriesQueryInput, context: UserContext) {
    await ensureEndpointAccess(endpointId, context);

    const where: Prisma.WebhookDeliveryWhereInput = {
      AND: [
        { endpointId },
        query.status ? { status: query.status } : undefined
      ].filter(Boolean) as Prisma.WebhookDeliveryWhereInput[]
    };

    const { skip, take } = calculatePagination(query.page, query.limit);

    const [items, total] = await prisma.$transaction([
      prisma.webhookDelivery.findMany({
        where,
        skip,
        take,
        orderBy: {
          createdAt: "desc"
        }
      }),
      prisma.webhookDelivery.count({ where })
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
}
