import { z } from "zod";

export const listApiCredentialsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().trim().optional(),
  isActive: z.coerce.boolean().optional()
});

export const credentialIdParamSchema = z.object({
  id: z.string().trim().min(1)
});

export const createApiCredentialSchema = z.object({
  name: z.string().trim().min(2).max(120),
  scopes: z.array(z.string().trim().min(1)).default([])
});

export const updateApiCredentialSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  scopes: z.array(z.string().trim().min(1)).optional(),
  isActive: z.coerce.boolean().optional()
});

export const rotateApiCredentialSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  scopes: z.array(z.string().trim().min(1)).optional()
});

export type ListApiCredentialsQueryInput = z.infer<typeof listApiCredentialsQuerySchema>;
export type CreateApiCredentialInput = z.infer<typeof createApiCredentialSchema>;
export type UpdateApiCredentialInput = z.infer<typeof updateApiCredentialSchema>;
export type RotateApiCredentialInput = z.infer<typeof rotateApiCredentialSchema>;
