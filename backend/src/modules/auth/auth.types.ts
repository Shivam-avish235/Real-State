import type { UserRole, UserStatus } from "@prisma/client";

export type AuthenticatedUserDto = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  role: UserRole;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
};

export type TokenPair = {
  accessToken: string;
  refreshToken: string;
};
