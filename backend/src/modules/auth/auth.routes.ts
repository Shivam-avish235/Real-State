import { Router } from "express";

import { authGuard } from "../../common/middleware/auth-guard";
import { validateRequest } from "../../common/middleware/validate-request";

import { changePassword, getMe, login, logout, logoutAll, refresh, register } from "./auth.controller";
import { changePasswordSchema, loginSchema, logoutSchema, refreshTokenSchema, registerSchema } from "./auth.validation";

const authRouter = Router();

authRouter.post("/register", validateRequest({ body: registerSchema }), register);
authRouter.post("/login", validateRequest({ body: loginSchema }), login);
authRouter.post("/refresh", validateRequest({ body: refreshTokenSchema }), refresh);
authRouter.post("/logout", validateRequest({ body: logoutSchema }), logout);
authRouter.post("/logout-all", authGuard, logoutAll);
authRouter.get("/me", authGuard, getMe);
authRouter.post("/change-password", authGuard, validateRequest({ body: changePasswordSchema }), changePassword);

export { authRouter };
