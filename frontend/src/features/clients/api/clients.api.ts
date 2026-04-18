import { apiClient } from "@/lib/http";

type ApiSuccess<T> = {
  success: true;
  message: string;
  data: T;
};

export type ClientItem = {
  id: string;
  type: "BUYER" | "SELLER" | "BOTH";
  firstName: string;
  lastName?: string | null;
  email?: string | null;
  phone: string;
  city?: string | null;
  state?: string | null;
  createdAt: string;
};

export const clientsApi = {
  async list(params?: { search?: string; page?: number; limit?: number }) {
    const response = await apiClient.get<ApiSuccess<{ items: ClientItem[]; pagination: { page: number; total: number; totalPages: number } }>>("/clients", {
      params
    });

    return response.data.data;
  },

  async create(payload: {
    type: "BUYER" | "SELLER" | "BOTH";
    firstName: string;
    lastName?: string;
    email?: string;
    phone: string;
    city?: string;
    state?: string;
    notes?: string;
  }) {
    const response = await apiClient.post<ApiSuccess<ClientItem>>("/clients", payload);
    return response.data.data;
  },

  async getById(id: string) {
    const response = await apiClient.get<ApiSuccess<unknown>>(`/clients/${id}`);
    return response.data.data;
  }
};
