import "dotenv/config";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  // Seed logic placeholder for upcoming modules.
  // Intentionally left minimal for Phase 2 Module 1.
  // eslint-disable-next-line no-console
  console.log("No seed data defined for auth module yet.");
}

main()
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
