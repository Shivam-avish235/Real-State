import type { Request, Response } from "express";

import { asyncHandler } from "../../common/middleware/async-handler";
import { createSuccessResponse } from "../../common/utils/api-response";

import { ClientsService } from "./clients.service";
import type {
    AddClientInteractionInput,
    AddClientVisitInput,
    CreateClientInput,
    ListClientsQueryInput,
    UpdateClientInput
} from "./clients.validation";

export const listClients = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as ListClientsQueryInput;
  const data = await ClientsService.listClients(query, req.user!);

  res.status(200).json(createSuccessResponse("Clients fetched", data));
});

export const createClient = asyncHandler(async (req: Request, res: Response) => {
  const payload = req.body as CreateClientInput;
  const data = await ClientsService.createClient(payload, req.user!);

  res.status(201).json(createSuccessResponse("Client created", data));
});

export const getClientById = asyncHandler(async (req: Request, res: Response) => {
  const data = await ClientsService.getClientById(req.params.id, req.user!);

  res.status(200).json(createSuccessResponse("Client fetched", data));
});

export const updateClient = asyncHandler(async (req: Request, res: Response) => {
  const payload = req.body as UpdateClientInput;
  const data = await ClientsService.updateClient(req.params.id, payload, req.user!);

  res.status(200).json(createSuccessResponse("Client updated", data));
});

export const deleteClient = asyncHandler(async (req: Request, res: Response) => {
  await ClientsService.deleteClient(req.params.id, req.user!);

  res.status(200).json(createSuccessResponse("Client deleted", { deleted: true }));
});

export const addClientVisit = asyncHandler(async (req: Request, res: Response) => {
  const payload = req.body as AddClientVisitInput;
  const data = await ClientsService.addVisit(req.params.id, payload, req.user!);

  res.status(201).json(createSuccessResponse("Client visit added", data));
});

export const addClientInteraction = asyncHandler(async (req: Request, res: Response) => {
  const payload = req.body as AddClientInteractionInput;
  const data = await ClientsService.addInteraction(req.params.id, payload, req.user!);

  res.status(201).json(createSuccessResponse("Client interaction added", data));
});

export const getClientInteractions = asyncHandler(async (req: Request, res: Response) => {
  const data = await ClientsService.getInteractions(req.params.id, req.user!);

  res.status(200).json(createSuccessResponse("Client interactions fetched", data));
});
