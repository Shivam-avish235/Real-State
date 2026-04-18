import type { CookieOptions } from "express";

import { durationToMilliseconds } from "../../common/utils/duration";
import { env } from "../../config/env";

export const REFRESH_TOKEN_COOKIE_NAME = "crm_refresh_token";

export const refreshTokenCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/api/v1/auth",
  maxAge: durationToMilliseconds(env.REFRESH_TOKEN_EXPIRES_IN)
};
