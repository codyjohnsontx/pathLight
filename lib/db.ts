import { PrismaClient } from "@prisma/client";

/**
 * PrismaClient singleton.
 *
 * Not used by the MVP ask-flow — it's here for the post-MVP DB features. The
 * client connects lazily on first query, so importing this file does not
 * require a running Postgres; the app boots fine without one.
 *
 * The global caching avoids exhausting connections during Next.js dev HMR.
 */
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma: PrismaClient =
  globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
