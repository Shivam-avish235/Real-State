import type { Request, Response } from "express";

import { asyncHandler } from "../../common/middleware/async-handler";
import { ApiError } from "../../common/utils/api-error";
import { createSuccessResponse } from "../../common/utils/api-response";
import { verifyAccessToken } from "../../common/utils/jwt";

import { REFRESH_TOKEN_COOKIE_NAME, refreshTokenCookieOptions } from "./auth.constants";
import { AuthService } from "./auth.service";
import type { ChangePasswordInput, LoginInput, LogoutInput, RefreshInput, RegisterInput } from "./auth.validation";

const readOptionalActorRole = (req: Request) => {
  const authHeader = req.headers.authorization;
  const tokenFromHeader = authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : undefined;
  const tokenFromCookie = req.cookies?.accessToken as string | undefined;
  const token = tokenFromHeader ?? tokenFromCookie;

  if (!token) {
    return undefined;
  }

  try {
    return verifyAccessToken(token).role;
  } catch {
    return undefined;
  }
};

const readRefreshToken = (req: Request): string | undefined => {
  const bodyToken = req.body?.refreshToken as string | undefined;
  const cookieToken = req.cookies?.[REFRESH_TOKEN_COOKIE_NAME] as string | undefined;

  return bodyToken ?? cookieToken;
};

export const register = asyncHandler(async (req: Request, res: Response) => {
  const payload = req.body as RegisterInput;
  const actorRole = readOptionalActorRole(req);
  const data = await AuthService.register(payload, actorRole);

  res.cookie(REFRESH_TOKEN_COOKIE_NAME, data.tokens.refreshToken, refreshTokenCookieOptions);

  res.status(201).json(
    createSuccessResponse("Registered successfully", {
      user: data.user,
      accessToken: data.tokens.accessToken
    })
  );
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const payload = req.body as LoginInput;
  const data = await AuthService.login(payload, req.get("user-agent"), req.ip);

  res.cookie(REFRESH_TOKEN_COOKIE_NAME, data.tokens.refreshToken, refreshTokenCookieOptions);

  res.status(200).json(
    createSuccessResponse("Logged in successfully", {
      user: data.user,
      accessToken: data.tokens.accessToken
    })
  );
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as RefreshInput;
  const token = body.refreshToken ?? readRefreshToken(req);

  if (!token) {
    throw new ApiError(401, "Refresh token is required");
  }

  const data = await AuthService.refreshAccessToken(token, req.get("user-agent"), req.ip);

  res.cookie(REFRESH_TOKEN_COOKIE_NAME, data.tokens.refreshToken, refreshTokenCookieOptions);

  res.status(200).json(
    createSuccessResponse("Token refreshed", {
      user: data.user,
      accessToken: data.tokens.accessToken
    })
  );
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as LogoutInput;
  const token = body.refreshToken ?? readRefreshToken(req);

  await AuthService.logout(token);
  res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, refreshTokenCookieOptions);

  res.status(200).json(createSuccessResponse("Logged out", { loggedOut: true }));
});

export const logoutAll = asyncHandler(async (req: Request, res: Response) => {
  await AuthService.logoutAll(req.user!.userId);
  res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, refreshTokenCookieOptions);

  res.status(200).json(createSuccessResponse("Logged out from all devices", { loggedOutAll: true }));
});

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const data = await AuthService.getMe(req.user!.userId);

  res.status(200).json(createSuccessResponse("User profile fetched", data));
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const payload = req.body as ChangePasswordInput;

  await AuthService.changePassword(req.user!.userId, payload);
  res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, refreshTokenCookieOptions);

  res.status(200).json(createSuccessResponse("Password changed. Please log in again.", { changed: true }));
});
