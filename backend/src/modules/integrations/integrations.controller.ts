import type { Request, Response } from "express";

import { asyncHandler } from "../../common/middleware/async-handler";
import { createSuccessResponse } from "../../common/utils/api-response";

import { IntegrationsService } from "./integrations.service";
import type {
    CreateApiCredentialInput,
    ListApiCredentialsQueryInput,
    RotateApiCredentialInput,
    UpdateApiCredentialInput
} from "./integrations.validation";

export const listApiCredentials = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as ListApiCredentialsQueryInput;
  const data = await IntegrationsService.listApiCredentials(query, req.user!);

  res.status(200).json(createSuccessResponse("API credentials fetched", data));
});

export const createApiCredential = asyncHandler(async (req: Request, res: Response) => {
  const payload = req.body as CreateApiCredentialInput;
  const data = await IntegrationsService.createApiCredential(payload, req.user!);

  res.status(201).json(createSuccessResponse("API credential created", data));
});

export const getApiCredentialById = asyncHandler(async (req: Request, res: Response) => {
  const data = await IntegrationsService.getApiCredentialById(req.params.id, req.user!);

  res.status(200).json(createSuccessResponse("API credential fetched", data));
});

export const updateApiCredential = asyncHandler(async (req: Request, res: Response) => {
  const payload = req.body as UpdateApiCredentialInput;
  const data = await IntegrationsService.updateApiCredential(req.params.id, payload, req.user!);

  res.status(200).json(createSuccessResponse("API credential updated", data));
});

export const revokeApiCredential = asyncHandler(async (req: Request, res: Response) => {
  const data = await IntegrationsService.revokeApiCredential(req.params.id, req.user!);

  res.status(200).json(createSuccessResponse("API credential revoked", data));
});

export const rotateApiCredential = asyncHandler(async (req: Request, res: Response) => {
  const payload = req.body as RotateApiCredentialInput;
  const data = await IntegrationsService.rotateApiCredential(req.params.id, payload, req.user!);

  res.status(200).json(createSuccessResponse("API credential rotated", data));
});
