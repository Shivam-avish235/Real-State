import type { Request, Response } from "express";

import { asyncHandler } from "../../common/middleware/async-handler";
import { createSuccessResponse } from "../../common/utils/api-response";

import { UsersService } from "./users.service";
import type { ListUsersQueryInput, UpdateUserInput } from "./users.validation";

export const listUsers = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as ListUsersQueryInput;
  const data = await UsersService.listUsers(query, req.user!);

  res.status(200).json(createSuccessResponse("Users fetched", data));
});

export const listAgents = asyncHandler(async (req: Request, res: Response) => {
  const data = await UsersService.listAgents(req.user!);

  res.status(200).json(createSuccessResponse("Agents fetched", data));
});

export const getUserById = asyncHandler(async (req: Request, res: Response) => {
  const data = await UsersService.getUserById(req.params.id, req.user!);

  res.status(200).json(createSuccessResponse("User fetched", data));
});

export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const payload = req.body as UpdateUserInput;
  const data = await UsersService.updateUser(req.params.id, payload, req.user!);

  res.status(200).json(createSuccessResponse("User updated", data));
});
