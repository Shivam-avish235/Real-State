import { Prisma, PrismaClient } from "@prisma/client";

import { env } from "./env";

declare global {
  // eslint-disable-next-line no-var
  var __prisma__: PrismaClient | undefined;
}

const prismaLogLevels: Prisma.LogLevel[] = env.NODE_ENV === "development" ? ["query", "info", "warn", "error"] : ["error", "warn"];

export const prisma =
  global.__prisma__ ??
  new PrismaClient({
    log: prismaLogLevels
  });

if (env.NODE_ENV !== "production") {
  global.__prisma__ = prisma;
}
