import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const logLevel =
  process.env.NODE_ENV === "development"
    ? (["query", "error", "warn"] as const)
    : (["error"] as const);

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ log: [...logLevel] });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
