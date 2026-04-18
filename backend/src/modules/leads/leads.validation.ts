import { ClientType, LeadSource, LeadStatus } from "@prisma/client";
import { z } from "zod";

export const listLeadsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().trim().optional(),
  status: z.nativeEnum(LeadStatus).optional(),
  source: z.nativeEnum(LeadSource).optional(),
  assignedToId: z.string().trim().optional(),
  createdById: z.string().trim().optional(),
  isApiLead: z.coerce.boolean().optional()
});

export const leadIdParamSchema = z.object({
  id: z.string().trim().min(1)
});

export const createLeadSchema = z.object({
  firstName: z.string().trim().min(2).max(60),
  lastName: z.string().trim().max(60).optional(),
  email: z.string().trim().email().optional(),
  phone: z.string().trim().min(7).max(20),
  alternatePhone: z.string().trim().max(20).optional(),
  budgetMin: z.coerce.number().nonnegative().optional(),
  budgetMax: z.coerce.number().nonnegative().optional(),
  preferredLocations: z.array(z.string().trim().min(1)).optional(),
  preferences: z.record(z.any()).optional(),
  source: z.nativeEnum(LeadSource).default(LeadSource.MANUAL),
  sourceDetails: z.string().trim().max(200).optional(),
  status: z.nativeEnum(LeadStatus).default(LeadStatus.NEW),
  score: z.coerce.number().int().min(0).max(100).default(0),
  notes: z.string().trim().max(4000).optional(),
  assignedToId: z.string().trim().optional(),
  nextFollowUpAt: z.coerce.date().optional(),
  externalRef: z.string().trim().max(120).optional()
});

export const updateLeadSchema = createLeadSchema.partial();

export const assignLeadSchema = z.object({
  agentId: z.string().trim().min(1),
  reason: z.string().trim().max(500).optional(),
  ruleId: z.string().trim().optional()
});

export const convertLeadSchema = z.object({
  clientType: z.nativeEnum(ClientType).default(ClientType.BUYER),
  ownerAgentId: z.string().trim().optional(),
  notes: z.string().trim().max(2000).optional()
});

export type ListLeadsQueryInput = z.infer<typeof listLeadsQuerySchema>;
export type CreateLeadInput = z.infer<typeof createLeadSchema>;
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;
export type AssignLeadInput = z.infer<typeof assignLeadSchema>;
export type ConvertLeadInput = z.infer<typeof convertLeadSchema>;
