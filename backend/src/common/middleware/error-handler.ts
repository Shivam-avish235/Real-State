import type { NextFunction, Request, Response } from "express";
import { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";
import { ZodError } from "zod";

import { env } from "../../config/env";
import { ApiError } from "../utils/api-error";

type ErrorResponse = {
  success: false;
  message: string;
  errors?: unknown;
  stack?: string;
};

export const errorHandler = (error: unknown, _req: Request, res: Response, _next: NextFunction): void => {
  if (error instanceof ZodError) {
    const response: ErrorResponse = {
      success: false,
      message: "Validation failed",
      errors: error.flatten()
    };

    res.status(400).json(response);
    return;
  }

  if (error instanceof ApiError) {
    const response: ErrorResponse = {
      success: false,
      message: error.message,
      errors: error.details
    };

    res.status(error.statusCode).json(response);
    return;
  }

  if (error instanceof TokenExpiredError) {
    res.status(401).json({
      success: false,
      message: "Token expired"
    } satisfies ErrorResponse);
    return;
  }

  if (error instanceof JsonWebTokenError) {
    res.status(401).json({
      success: false,
      message: "Invalid token"
    } satisfies ErrorResponse);
    return;
  }

  const fallbackError = error as Error;

  res.status(500).json({
    success: false,
    message: "Internal server error",
    ...(env.NODE_ENV !== "production" ? { stack: fallbackError?.stack } : {})
  } satisfies ErrorResponse);
};
