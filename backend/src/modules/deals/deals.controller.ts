import type { Request, Response } from "express";

import { asyncHandler } from "../../common/middleware/async-handler";
import { createSuccessResponse } from "../../common/utils/api-response";

import { DealsService } from "./deals.service";
import type {
    AddDealDocumentInput,
    CreateDealInput,
    ListDealsQueryInput,
    MoveDealStageInput,
    UpdateDealInput
} from "./deals.validation";

export const listDeals = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as ListDealsQueryInput;
  const data = await DealsService.listDeals(query, req.user!);

  res.status(200).json(createSuccessResponse("Deals fetched", data));
});

export const getDealPipeline = asyncHandler(async (req: Request, res: Response) => {
  const data = await DealsService.getPipeline(req.user!);

  res.status(200).json(createSuccessResponse("Deal pipeline fetched", data));
});

export const createDeal = asyncHandler(async (req: Request, res: Response) => {
  const payload = req.body as CreateDealInput;
  const data = await DealsService.createDeal(payload, req.user!);

  res.status(201).json(createSuccessResponse("Deal created", data));
});

export const getDealById = asyncHandler(async (req: Request, res: Response) => {
  const data = await DealsService.getDealById(req.params.id, req.user!);

  res.status(200).json(createSuccessResponse("Deal fetched", data));
});

export const updateDeal = asyncHandler(async (req: Request, res: Response) => {
  const payload = req.body as UpdateDealInput;
  const data = await DealsService.updateDeal(req.params.id, payload, req.user!);

  res.status(200).json(createSuccessResponse("Deal updated", data));
});

export const moveDealStage = asyncHandler(async (req: Request, res: Response) => {
  const payload = req.body as MoveDealStageInput;
  const data = await DealsService.moveStage(req.params.id, payload, req.user!);

  res.status(200).json(createSuccessResponse("Deal stage updated", data));
});

export const addDealDocument = asyncHandler(async (req: Request, res: Response) => {
  const payload = req.body as AddDealDocumentInput;
  const data = await DealsService.addDocument(req.params.id, payload, req.user!);

  res.status(201).json(createSuccessResponse("Deal document added", data));
});

export const listDealDocuments = asyncHandler(async (req: Request, res: Response) => {
  const data = await DealsService.listDocuments(req.params.id, req.user!);

  res.status(200).json(createSuccessResponse("Deal documents fetched", data));
});

export const deleteDeal = asyncHandler(async (req: Request, res: Response) => {
  await DealsService.deleteDeal(req.params.id, req.user!);

  res.status(200).json(createSuccessResponse("Deal deleted", { deleted: true }));
});
