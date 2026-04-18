import type { NextFunction, Request, Response } from "express";

import { verifyAccessToken } from "../utils/jwt";

export const authGuard = (req: Request, res: Response, next: NextFunction): void => {
  const authorization = req.headers.authorization;
  const bearerToken = authorization?.startsWith("Bearer ") ? authorization.split(" ")[1] : undefined;
  const token = bearerToken ?? req.cookies?.accessToken;

  if (!token) {
    res.status(401).json({
      success: false,
      message: "Unauthorized"
    });
    return;
  }

  const payload = verifyAccessToken(token);

  req.user = {
    userId: payload.userId,
    role: payload.role
  };

  next();
};
