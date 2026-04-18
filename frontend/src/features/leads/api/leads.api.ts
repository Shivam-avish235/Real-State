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

export type LeadStatus = "NEW" | "CONTACTED" | "QUALIFIED" | "NEGOTIATING" | "CLOSED" | "LOST";
export type LeadSource = "MANUAL" | "WEBSITE" | "PORTAL" | "REFERRAL" | "SOCIAL_MEDIA" | "WHATSAPP" | "API" | "OTHER";

export type LeadItem = {
  id: string;
  firstName: string;
  lastName?: string | null;
  fullName?: string | null;
  email?: string | null;
  phone: string;
  source: LeadSource;
  status: LeadStatus;
  score: number;
  createdAt: string;
  assignedTo?: {
    id: string;
    firstName: string;
    lastName?: string | null;
    email: string;
  } | null;
};

export type CreateLeadPayload = {
  firstName: string;
  lastName?: string;
  email?: string;
  phone: string;
  source?: LeadSource;
};

export const leadsApi = {
  async list(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: LeadStatus;
    source?: LeadSource;
  }) {
    const response = await apiClient.get<ApiSuccess<{ items: LeadItem[]; pagination: Pagination }>>("/leads", {
      params
    });

    return response.data.data;
  },

  async create(payload: CreateLeadPayload) {
    const response = await apiClient.post<ApiSuccess<LeadItem>>("/leads", payload);
    return response.data.data;
  },

  async update(id: string, payload: Partial<CreateLeadPayload & { status: LeadStatus }>) {
    const response = await apiClient.patch<ApiSuccess<LeadItem>>(`/leads/${id}`, payload);
    return response.data.data;
  },

  async convert(id: string, payload?: { clientType?: "BUYER" | "SELLER" | "BOTH"; ownerAgentId?: string }) {
    const response = await apiClient.post<ApiSuccess<unknown>>(`/leads/${id}/convert`, payload ?? {});
    return response.data.data;
  }
};
