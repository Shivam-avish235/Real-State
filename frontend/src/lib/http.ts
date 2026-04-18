import axios, { type InternalAxiosRequestConfig } from "axios";

import type { ApiSuccessResponse, AuthPayload } from "@/features/auth/auth.types";
import { useAuthStore } from "@/store/auth.store";

type RetriableRequest = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000/api/v1";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json"
  }
});

const refreshClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as RetriableRequest | undefined;
    const status = error.response?.status;
    const originalUrl = String(originalRequest?.url ?? "");

    if (
      status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalUrl.includes("/auth/login") &&
      !originalUrl.includes("/auth/register") &&
      !originalUrl.includes("/auth/refresh")
    ) {
      originalRequest._retry = true;

      try {
        const response = await refreshClient.post<ApiSuccessResponse<AuthPayload>>("/auth/refresh", {});
        const payload = response.data.data;

        useAuthStore.getState().setSession(payload.user, payload.accessToken);

        originalRequest.headers.Authorization = `Bearer ${payload.accessToken}`;

        return apiClient(originalRequest);
      } catch {
        useAuthStore.getState().clearSession();
      }
    }

    return Promise.reject(error);
  }
);
