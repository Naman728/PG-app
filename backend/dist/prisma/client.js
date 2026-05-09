import { PrismaClient } from "@prisma/client";
const globalForPrisma = globalThis;
const logLevel = process.env.NODE_ENV === "development"
    ? ["query", "error", "warn"]
    : ["error"];
export const prisma = globalForPrisma.prisma ?? new PrismaClient({ log: [...logLevel] });
if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
}
//# sourceMappingURL=client.js.map