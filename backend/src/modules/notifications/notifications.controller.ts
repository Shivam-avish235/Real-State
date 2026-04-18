import type { Request, Response } from "express";

import { asyncHandler } from "../../common/middleware/async-handler";
import { createSuccessResponse } from "../../common/utils/api-response";

import { NotificationsService } from "./notifications.service";
import type { CreateNotificationInput, ListNotificationsQueryInput, MarkAllReadInput } from "./notifications.validation";

export const listNotifications = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as ListNotificationsQueryInput;
  const data = await NotificationsService.listNotifications(query, req.user!);

  res.status(200).json(createSuccessResponse("Notifications fetched", data));
});

export const createNotification = asyncHandler(async (req: Request, res: Response) => {
  const payload = req.body as CreateNotificationInput;
  const data = await NotificationsService.createNotification(payload, req.user!);

  res.status(201).json(createSuccessResponse("Notification created", data));
});

export const getNotificationById = asyncHandler(async (req: Request, res: Response) => {
  const data = await NotificationsService.getNotificationById(req.params.id, req.user!);

  res.status(200).json(createSuccessResponse("Notification fetched", data));
});

export const markNotificationRead = asyncHandler(async (req: Request, res: Response) => {
  const data = await NotificationsService.markNotificationRead(req.params.id, req.user!);

  res.status(200).json(createSuccessResponse("Notification marked as read", data));
});

export const markAllNotificationsRead = asyncHandler(async (req: Request, res: Response) => {
  const payload = req.body as MarkAllReadInput;
  const data = await NotificationsService.markAllRead(payload, req.user!);

  res.status(200).json(createSuccessResponse("Notifications marked as read", data));
});

export const deleteNotification = asyncHandler(async (req: Request, res: Response) => {
  await NotificationsService.deleteNotification(req.params.id, req.user!);

  res.status(200).json(createSuccessResponse("Notification deleted", { deleted: true }));
});
