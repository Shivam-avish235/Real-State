import { apiClient } from "@/lib/http";

import type { ApiSuccessResponse, AuthPayload, AuthUser } from "../auth.types";

type RegisterInput = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  password: string;
};

type LoginInput = {
  email: string;
  password: string;
};

type ChangePasswordInput = {
  currentPassword: string;
  newPassword: string;
};

export const authApi = {
  async register(input: RegisterInput): Promise<AuthPayload> {
    const response = await apiClient.post<ApiSuccessResponse<AuthPayload>>("/auth/register", input);
    return response.data.data;
  },

  async login(input: LoginInput): Promise<AuthPayload> {
    const response = await apiClient.post<ApiSuccessResponse<AuthPayload>>("/auth/login", input);
    return response.data.data;
  },

  async refresh(): Promise<AuthPayload> {
    const response = await apiClient.post<ApiSuccessResponse<AuthPayload>>("/auth/refresh", {});
    return response.data.data;
  },

  async me(): Promise<AuthUser> {
    const response = await apiClient.get<ApiSuccessResponse<AuthUser>>("/auth/me");
    return response.data.data;
  },

  async logout(): Promise<void> {
    await apiClient.post("/auth/logout", {});
  },

  async logoutAll(): Promise<void> {
    await apiClient.post("/auth/logout-all", {});
  },

  async changePassword(input: ChangePasswordInput): Promise<void> {
    await apiClient.post("/auth/change-password", input);
  }
};
