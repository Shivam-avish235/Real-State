import { ActivityDirection, ActivityType, ClientType, VisitStatus } from "@prisma/client";
import { z } from "zod";

export const listClientsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().trim().optional(),
  type: z.nativeEnum(ClientType).optional(),
  ownerAgentId: z.string().trim().optional()
});

export const clientIdParamSchema = z.object({
  id: z.string().trim().min(1)
});

export const createClientSchema = z.object({
  type: z.nativeEnum(ClientType),
  firstName: z.string().trim().min(2).max(60),
  lastName: z.string().trim().max(60).optional(),
  companyName: z.string().trim().max(120).optional(),
  email: z.string().trim().email().optional(),
  phone: z.string().trim().min(7).max(20),
  alternatePhone: z.string().trim().max(20).optional(),
  budgetMin: z.coerce.number().nonnegative().optional(),
  budgetMax: z.coerce.number().nonnegative().optional(),
  preferences: z.record(z.any()).optional(),
  addressLine1: z.string().trim().max(120).optional(),
  addressLine2: z.string().trim().max(120).optional(),
  city: z.string().trim().max(80).optional(),
  state: z.string().trim().max(80).optional(),
  country: z.string().trim().max(80).optional(),
  zipCode: z.string().trim().max(20).optional(),
  notes: z.string().trim().max(2000).optional(),
  ownerAgentId: z.string().trim().optional(),
  leadId: z.string().trim().optional()
});

export const updateClientSchema = createClientSchema.partial();

export const addClientVisitSchema = z.object({
  propertyId: z.string().trim().min(1),
  visitAt: z.coerce.date(),
  status: z.nativeEnum(VisitStatus).default(VisitStatus.SCHEDULED),
  feedback: z.string().trim().max(2000).optional(),
  rating: z.coerce.number().int().min(1).max(5).optional()
});

export const addClientInteractionSchema = z.object({
  type: z.nativeEnum(ActivityType),
  direction: z.nativeEnum(ActivityDirection).default(ActivityDirection.INTERNAL),
  subject: z.string().trim().max(200).optional(),
  description: z.string().trim().max(4000).optional(),
  metadata: z.record(z.any()).optional(),
  performedAt: z.coerce.date().optional()
});

export type ListClientsQueryInput = z.infer<typeof listClientsQuerySchema>;
export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
export type AddClientVisitInput = z.infer<typeof addClientVisitSchema>;
export type AddClientInteractionInput = z.infer<typeof addClientInteractionSchema>;
