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

export type PropertyType = "RESIDENTIAL" | "COMMERCIAL" | "LAND" | "INDUSTRIAL" | "OTHER";
export type PropertyStatus = "AVAILABLE" | "SOLD" | "RENTED" | "OFF_MARKET";

export type PropertyItem = {
  id: string;
  title: string;
  city: string;
  state: string;
  country: string;
  type: PropertyType;
  status: PropertyStatus;
  listingPrice: number | string;
  createdAt: string;
  ownerAgent?: {
    id: string;
    firstName: string;
    lastName?: string | null;
    email: string;
  } | null;
};

export type CreatePropertyPayload = {
  title: string;
  addressLine1: string;
  city: string;
  state: string;
  country: string;
  type: PropertyType;
  listingPrice: number;
  status?: PropertyStatus;
};

export const propertiesApi = {
  async list(params?: { page?: number; limit?: number; search?: string; type?: PropertyType; status?: PropertyStatus }) {
    const response = await apiClient.get<ApiSuccess<{ items: PropertyItem[]; pagination: Pagination }>>("/properties", {
      params
    });

    return response.data.data;
  },

  async create(payload: CreatePropertyPayload) {
    const response = await apiClient.post<ApiSuccess<PropertyItem>>("/properties", payload);
    return response.data.data;
  },

  async update(id: string, payload: Partial<CreatePropertyPayload>) {
    const response = await apiClient.patch<ApiSuccess<PropertyItem>>(`/properties/${id}`, payload);
    return response.data.data;
  }
};
