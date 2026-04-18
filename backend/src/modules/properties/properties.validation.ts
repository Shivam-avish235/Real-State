import { PropertyStatus, PropertyType } from "@prisma/client";
import { z } from "zod";

export const listPropertiesQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().trim().optional(),
  type: z.nativeEnum(PropertyType).optional(),
  status: z.nativeEnum(PropertyStatus).optional(),
  city: z.string().trim().optional(),
  state: z.string().trim().optional(),
  country: z.string().trim().optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().nonnegative().optional(),
  ownerAgentId: z.string().trim().optional(),
  isFeatured: z.coerce.boolean().optional()
});

export const propertyIdParamSchema = z.object({
  id: z.string().trim().min(1)
});

export const createPropertySchema = z.object({
  title: z.string().trim().min(2).max(200),
  description: z.string().trim().max(6000).optional(),
  addressLine1: z.string().trim().min(2).max(160),
  addressLine2: z.string().trim().max(160).optional(),
  city: z.string().trim().min(2).max(80),
  state: z.string().trim().min(2).max(80),
  country: z.string().trim().min(2).max(80),
  zipCode: z.string().trim().max(20).optional(),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  type: z.nativeEnum(PropertyType),
  status: z.nativeEnum(PropertyStatus).default(PropertyStatus.AVAILABLE),
  listingPrice: z.coerce.number().nonnegative(),
  sizeSqft: z.coerce.number().nonnegative().optional(),
  bedrooms: z.coerce.number().int().nonnegative().optional(),
  bathrooms: z.coerce.number().nonnegative().optional(),
  parkingSpaces: z.coerce.number().int().nonnegative().optional(),
  yearBuilt: z.coerce.number().int().min(1800).max(2200).optional(),
  amenities: z.array(z.string().trim().min(1)).optional(),
  tags: z.array(z.string().trim().min(1)).optional(),
  isFeatured: z.coerce.boolean().default(false),
  ownerAgentId: z.string().trim().optional()
});

export const updatePropertySchema = createPropertySchema.partial();

export const addPropertyImageSchema = z.object({
  url: z.string().trim().url(),
  publicId: z.string().trim().min(1).max(255),
  caption: z.string().trim().max(300).optional(),
  isPrimary: z.coerce.boolean().default(false),
  sortOrder: z.coerce.number().int().min(0).default(0)
});

export type ListPropertiesQueryInput = z.infer<typeof listPropertiesQuerySchema>;
export type CreatePropertyInput = z.infer<typeof createPropertySchema>;
export type UpdatePropertyInput = z.infer<typeof updatePropertySchema>;
export type AddPropertyImageInput = z.infer<typeof addPropertyImageSchema>;
