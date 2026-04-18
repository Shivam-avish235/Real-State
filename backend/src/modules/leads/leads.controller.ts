import type { Request, Response } from "express";

import { asyncHandler } from "../../common/middleware/async-handler";
import { createSuccessResponse } from "../../common/utils/api-response";

import { LeadsService } from "./leads.service";
import type {
    AssignLeadInput,
    ConvertLeadInput,
    CreateLeadInput,
    ListLeadsQueryInput,
    UpdateLeadInput
} from "./leads.validation";

export const listLeads = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as ListLeadsQueryInput;
  const data = await LeadsService.listLeads(query, req.user!);

  res.status(200).json(createSuccessResponse("Leads fetched", data));
});

export const createLead = asyncHandler(async (req: Request, res: Response) => {
  const payload = req.body as CreateLeadInput;
  const data = await LeadsService.createLead(payload, req.user!);

  res.status(201).json(createSuccessResponse("Lead created", data));
});

export const getLeadById = asyncHandler(async (req: Request, res: Response) => {
  const data = await LeadsService.getLeadById(req.params.id, req.user!);

  res.status(200).json(createSuccessResponse("Lead fetched", data));
});

export const updateLead = asyncHandler(async (req: Request, res: Response) => {
  const payload = req.body as UpdateLeadInput;
  const data = await LeadsService.updateLead(req.params.id, payload, req.user!);

  res.status(200).json(createSuccessResponse("Lead updated", data));
});

export const deleteLead = asyncHandler(async (req: Request, res: Response) => {
  await LeadsService.deleteLead(req.params.id, req.user!);

  res.status(200).json(createSuccessResponse("Lead deleted", { deleted: true }));
});

export const assignLead = asyncHandler(async (req: Request, res: Response) => {
  const payload = req.body as AssignLeadInput;
  const data = await LeadsService.assignLead(req.params.id, payload, req.user!);

  res.status(200).json(createSuccessResponse("Lead assigned", data));
});

export const convertLeadToClient = asyncHandler(async (req: Request, res: Response) => {
  const payload = req.body as ConvertLeadInput;
  const data = await LeadsService.convertLeadToClient(req.params.id, payload, req.user!);

  res.status(201).json(createSuccessResponse("Lead converted to client", data));
});
