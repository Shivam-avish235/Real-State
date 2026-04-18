import type { Request, Response } from "express";

import { asyncHandler } from "../../common/middleware/async-handler";
import { createSuccessResponse } from "../../common/utils/api-response";

import { PropertiesService } from "./properties.service";
import type {
    AddPropertyImageInput,
    CreatePropertyInput,
    ListPropertiesQueryInput,
    UpdatePropertyInput
} from "./properties.validation";

export const listProperties = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as ListPropertiesQueryInput;
  const data = await PropertiesService.listProperties(query, req.user!);

  res.status(200).json(createSuccessResponse("Properties fetched", data));
});

export const createProperty = asyncHandler(async (req: Request, res: Response) => {
  const payload = req.body as CreatePropertyInput;
  const data = await PropertiesService.createProperty(payload, req.user!);

  res.status(201).json(createSuccessResponse("Property created", data));
});

export const getPropertyById = asyncHandler(async (req: Request, res: Response) => {
  const data = await PropertiesService.getPropertyById(req.params.id, req.user!);

  res.status(200).json(createSuccessResponse("Property fetched", data));
});

export const updateProperty = asyncHandler(async (req: Request, res: Response) => {
  const payload = req.body as UpdatePropertyInput;
  const data = await PropertiesService.updateProperty(req.params.id, payload, req.user!);

  res.status(200).json(createSuccessResponse("Property updated", data));
});

export const deleteProperty = asyncHandler(async (req: Request, res: Response) => {
  await PropertiesService.deleteProperty(req.params.id, req.user!);

  res.status(200).json(createSuccessResponse("Property deleted", { deleted: true }));
});

export const listPropertyImages = asyncHandler(async (req: Request, res: Response) => {
  const data = await PropertiesService.listPropertyImages(req.params.id, req.user!);

  res.status(200).json(createSuccessResponse("Property images fetched", data));
});

export const addPropertyImage = asyncHandler(async (req: Request, res: Response) => {
  const payload = req.body as AddPropertyImageInput;
  const data = await PropertiesService.addPropertyImage(req.params.id, payload, req.user!);

  res.status(201).json(createSuccessResponse("Property image added", data));
});
