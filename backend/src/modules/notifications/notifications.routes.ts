import { Router } from "express";

import { authGuard } from "../../common/middleware/auth-guard";
import { requireRole } from "../../common/middleware/require-role";
import { validateRequest } from "../../common/middleware/validate-request";

import {
    createNotification,
    deleteNotification,
    getNotificationById,
    listNotifications,
    markAllNotificationsRead,
    markNotificationRead
} from "./notifications.controller";
import {
    createNotificationSchema,
    listNotificationsQuerySchema,
    markAllReadSchema,
    notificationIdParamSchema
} from "./notifications.validation";

const notificationsRouter = Router();

notificationsRouter.use(authGuard);

notificationsRouter.get("/", validateRequest({ query: listNotificationsQuerySchema }), listNotifications);
notificationsRouter.post("/", requireRole("ADMIN", "MANAGER"), validateRequest({ body: createNotificationSchema }), createNotification);
notificationsRouter.get("/:id", validateRequest({ params: notificationIdParamSchema }), getNotificationById);
notificationsRouter.patch("/:id/read", validateRequest({ params: notificationIdParamSchema }), markNotificationRead);
notificationsRouter.patch("/read-all", validateRequest({ body: markAllReadSchema }), markAllNotificationsRead);
notificationsRouter.delete("/:id", validateRequest({ params: notificationIdParamSchema }), deleteNotification);

export { notificationsRouter };
