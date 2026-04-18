import type { UserRole, UserStatus } from "@/features/auth/auth.types";
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

export type UserItem = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  role: UserRole;
  status: UserStatus;
  managerId?: string | null;
  createdAt: string;
};

export const usersApi = {
  async list(params?: { page?: number; limit?: number; search?: string; role?: UserRole; status?: UserStatus }) {
    const response = await apiClient.get<ApiSuccess<{ items: UserItem[]; pagination: Pagination }>>("/users", {
      params
    });

    return response.data.data;
  },

  async listAgents() {
    const response = await apiClient.get<ApiSuccess<UserItem[]>>("/users/agents");
    return response.data.data;
  },

  async update(id: string, payload: Partial<{ role: UserRole; status: UserStatus; managerId: string | null }>) {
    const response = await apiClient.patch<ApiSuccess<UserItem>>(`/users/${id}`, payload);
    return response.data.data;
  }
};
