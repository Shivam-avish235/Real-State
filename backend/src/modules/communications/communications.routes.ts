import { Router } from "express";

import { authGuard } from "../../common/middleware/auth-guard";
import { validateRequest } from "../../common/middleware/validate-request";

import {
    cancelReminder,
    completeReminder,
    createActivity,
    listReminders,
    listTimeline,
    scheduleReminder,
    sendNotification
} from "./communications.controller";
import {
    createActivitySchema,
    listRemindersQuerySchema,
    listTimelineQuerySchema,
    reminderIdParamSchema,
    scheduleReminderSchema,
    sendNotificationSchema
} from "./communications.validation";

const communicationsRouter = Router();

communicationsRouter.use(authGuard);

communicationsRouter.get("/timeline", validateRequest({ query: listTimelineQuerySchema }), listTimeline);
communicationsRouter.post("/timeline", validateRequest({ body: createActivitySchema }), createActivity);
communicationsRouter.get("/reminders", validateRequest({ query: listRemindersQuerySchema }), listReminders);
communicationsRouter.post("/reminders", validateRequest({ body: scheduleReminderSchema }), scheduleReminder);
communicationsRouter.post("/reminders/:id/complete", validateRequest({ params: reminderIdParamSchema }), completeReminder);
communicationsRouter.post("/reminders/:id/cancel", validateRequest({ params: reminderIdParamSchema }), cancelReminder);
communicationsRouter.post("/notifications", validateRequest({ body: sendNotificationSchema }), sendNotification);

export { communicationsRouter };
