import type { Request, Response } from "express";

import { asyncHandler } from "../../common/middleware/async-handler";
import { createSuccessResponse } from "../../common/utils/api-response";

import { CommunicationsService } from "./communications.service";
import type {
    CreateActivityInput,
    ListRemindersQueryInput,
    ListTimelineQueryInput,
    ScheduleReminderInput,
    SendNotificationInput
} from "./communications.validation";

export const listTimeline = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as ListTimelineQueryInput;
  const data = await CommunicationsService.listTimeline(query, req.user!);

  res.status(200).json(createSuccessResponse("Activity timeline fetched", data));
});

export const createActivity = asyncHandler(async (req: Request, res: Response) => {
  const payload = req.body as CreateActivityInput;
  const data = await CommunicationsService.createActivity(payload, req.user!);

  res.status(201).json(createSuccessResponse("Activity created", data));
});

export const scheduleReminder = asyncHandler(async (req: Request, res: Response) => {
  const payload = req.body as ScheduleReminderInput;
  const data = await CommunicationsService.scheduleReminder(payload, req.user!);

  res.status(201).json(createSuccessResponse("Reminder scheduled", data));
});

export const listReminders = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as ListRemindersQueryInput;
  const data = await CommunicationsService.listReminders(query, req.user!);

  res.status(200).json(createSuccessResponse("Reminders fetched", data));
});

export const completeReminder = asyncHandler(async (req: Request, res: Response) => {
  const data = await CommunicationsService.updateReminderStatus(req.params.id, "COMPLETED", req.user!);

  res.status(200).json(createSuccessResponse("Reminder completed", data));
});

export const cancelReminder = asyncHandler(async (req: Request, res: Response) => {
  const data = await CommunicationsService.updateReminderStatus(req.params.id, "CANCELLED", req.user!);

  res.status(200).json(createSuccessResponse("Reminder cancelled", data));
});

export const sendNotification = asyncHandler(async (req: Request, res: Response) => {
  const payload = req.body as SendNotificationInput;
  const data = await CommunicationsService.sendNotification(payload, req.user!);

  res.status(201).json(createSuccessResponse("Notification processed", data));
});
