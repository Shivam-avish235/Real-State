import "dotenv/config";

import { app } from "./app";
import { env } from "./config/env";
import { prisma } from "./config/prisma";

const server = app.listen(env.PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Server running at ${env.APP_BASE_URL} on port ${env.PORT}`);
});

const gracefulShutdown = async (signal: string): Promise<void> => {
  // eslint-disable-next-line no-console
  console.log(`${signal} received. Closing server and database connections...`);

  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
};

process.on("SIGINT", () => {
  void gracefulShutdown("SIGINT");
});

process.on("SIGTERM", () => {
  void gracefulShutdown("SIGTERM");
});
