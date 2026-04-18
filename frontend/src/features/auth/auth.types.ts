export type UserRole = "ADMIN" | "MANAGER" | "AGENT";
export type UserStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";

export type AuthUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
};

export type AuthPayload = {
  user: AuthUser;
  accessToken: string;
};

export type ApiSuccessResponse<T> = {
  success: true;
  message: string;
  data: T;
};
