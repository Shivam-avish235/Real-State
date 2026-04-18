import { UserRole, UserStatus } from "@prisma/client";
import { z } from "zod";

export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().trim().optional(),
  role: z.nativeEnum(UserRole).optional(),
  status: z.nativeEnum(UserStatus).optional(),
  managerId: z.string().trim().optional()
});

export const userIdParamSchema = z.object({
  id: z.string().trim().min(1)
});

export const updateUserSchema = z.object({
  firstName: z.string().trim().min(2).max(50).optional(),
  lastName: z.string().trim().min(1).max(50).optional(),
  email: z.string().trim().email().optional(),
  phone: z.string().trim().min(7).max(20).optional(),
  avatarUrl: z.string().trim().url().optional(),
  role: z.nativeEnum(UserRole).optional(),
  status: z.nativeEnum(UserStatus).optional(),
  managerId: z.string().trim().nullable().optional()
});

export type ListUsersQueryInput = z.infer<typeof listUsersQuerySchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
