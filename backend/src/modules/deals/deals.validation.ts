import { DealDocumentType, DealStage, DealStatus } from "@prisma/client";
import { z } from "zod";

export const dealIdParamSchema = z.object({
  id: z.string().trim().min(1)
});

export const listDealsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().trim().optional(),
  stage: z.nativeEnum(DealStage).optional(),
  status: z.nativeEnum(DealStatus).optional(),
  ownerId: z.string().trim().optional(),
  clientId: z.string().trim().optional(),
  leadId: z.string().trim().optional()
});

export const createDealSchema = z.object({
  title: z.string().trim().min(2).max(200),
  description: z.string().trim().max(4000).optional(),
  stage: z.nativeEnum(DealStage).default(DealStage.INQUIRY),
  status: z.nativeEnum(DealStatus).default(DealStatus.OPEN),
  expectedCloseDate: z.coerce.date().optional(),
  closeDate: z.coerce.date().optional(),
  dealValue: z.coerce.number().nonnegative(),
  commissionRate: z.coerce.number().min(0).max(100).optional(),
  commissionAmount: z.coerce.number().nonnegative().optional(),
  commissionPaid: z.coerce.number().nonnegative().default(0),
  currency: z.string().trim().min(3).max(5).default("USD"),
  clientId: z.string().trim().min(1),
  propertyId: z.string().trim().optional(),
  leadId: z.string().trim().optional(),
  ownerId: z.string().trim().optional()
});

export const updateDealSchema = createDealSchema.partial();

export const moveDealStageSchema = z.object({
  toStage: z.nativeEnum(DealStage),
  note: z.string().trim().max(2000).optional()
});

export const addDealDocumentSchema = z.object({
  type: z.nativeEnum(DealDocumentType).default(DealDocumentType.OTHER),
  fileName: z.string().trim().min(1).max(255),
  mimeType: z.string().trim().min(1).max(100),
  sizeBytes: z.coerce.number().int().positive(),
  url: z.string().trim().url(),
  publicId: z.string().trim().max(255).optional(),
  notes: z.string().trim().max(1000).optional(),
  expiresAt: z.coerce.date().optional()
});

export type ListDealsQueryInput = z.infer<typeof listDealsQuerySchema>;
export type CreateDealInput = z.infer<typeof createDealSchema>;
export type UpdateDealInput = z.infer<typeof updateDealSchema>;
export type MoveDealStageInput = z.infer<typeof moveDealStageSchema>;
export type AddDealDocumentInput = z.infer<typeof addDealDocumentSchema>;
