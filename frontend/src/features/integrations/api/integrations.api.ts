import { apiClient } from "@/lib/http";

type ApiSuccess<T> = {
  success: true;
  message: string;
  data: T;
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type WebhookEventType =
  | "LEAD_CREATED"
  | "LEAD_UPDATED"
  | "DEAL_STAGE_CHANGED"
  | "DEAL_CLOSED"
  | "PROPERTY_CREATED"
  | "PROPERTY_UPDATED"
  | "NOTIFICATION_SENT";

export type ApiCredentialItem = {
  id: string;
  name: string;
  scopes: unknown;
  isActive: boolean;
  lastUsedAt?: string | null;
  createdAt: string;
  createdById: string;
};

export type WebhookEndpointItem = {
  id: string;
  name: string;
  url: string;
  isActive: boolean;
  events: unknown;
  failureCount: number;
  lastTriggeredAt?: string | null;
  createdAt: string;
};

export const integrationsApi = {
  async listCredentials(params?: { page?: number; limit?: number; search?: string; isActive?: boolean }) {
    const response = await apiClient.get<ApiSuccess<{ items: ApiCredentialItem[]; pagination: Pagination }>>(
      "/integrations/credentials",
      { params }
    );

    return response.data.data;
  },

  async createCredential(payload: { name: string; scopes: string[] }) {
    const response = await apiClient.post<ApiSuccess<{ credential: ApiCredentialItem; apiKey: string }>>(
      "/integrations/credentials",
      payload
    );

    return response.data.data;
  },

  async revokeCredential(id: string) {
    const response = await apiClient.post<ApiSuccess<ApiCredentialItem>>(`/integrations/credentials/${id}/revoke`, {});
    return response.data.data;
  },

  async rotateCredential(id: string, payload?: { name?: string; scopes?: string[] }) {
    const response = await apiClient.post<ApiSuccess<{ credential: ApiCredentialItem; apiKey: string }>>(
      `/integrations/credentials/${id}/rotate`,
      payload ?? {}
    );

    return response.data.data;
  },

  async listWebhookEndpoints(params?: { page?: number; limit?: number; search?: string; isActive?: boolean }) {
    const response = await apiClient.get<ApiSuccess<{ items: WebhookEndpointItem[]; pagination: Pagination }>>("/webhooks", {
      params
    });

    return response.data.data;
  },

  async createWebhookEndpoint(payload: { name: string; url: string; events: WebhookEventType[] }) {
    const response = await apiClient.post<ApiSuccess<{ endpoint: WebhookEndpointItem; secret: string }>>("/webhooks", payload);
    return response.data.data;
  },

  async triggerWebhook(id: string, payload: { eventType: WebhookEventType; payload: Record<string, unknown> }) {
    const response = await apiClient.post<ApiSuccess<unknown>>(`/webhooks/${id}/trigger`, payload);
    return response.data.data;
  }
};
