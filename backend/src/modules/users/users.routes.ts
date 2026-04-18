import { Router } from "express";

import { authGuard } from "../../common/middleware/auth-guard";
import { requireRole } from "../../common/middleware/require-role";
import { validateRequest } from "../../common/middleware/validate-request";

import { getUserById, listAgents, listUsers, updateUser } from "./users.controller";
import { listUsersQuerySchema, updateUserSchema, userIdParamSchema } from "./users.validation";

const usersRouter = Router();

usersRouter.use(authGuard);

usersRouter.get("/agents", requireRole("ADMIN", "MANAGER"), listAgents);
usersRouter.get("/", requireRole("ADMIN", "MANAGER"), validateRequest({ query: listUsersQuerySchema }), listUsers);
usersRouter.get("/:id", validateRequest({ params: userIdParamSchema }), getUserById);
usersRouter.patch("/:id", validateRequest({ params: userIdParamSchema, body: updateUserSchema }), updateUser);

export { usersRouter };
