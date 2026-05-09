import { PrismaClient } from "@prisma/client";
import { loadEnv } from "../config/env.js";
const globalForPrisma = globalThis;
export const prisma = globalForPrisma.prisma ??
    new PrismaClient({
        log: loadEnv().NODE_ENV === "development"
            ? ["query", "error", "warn"]
            : ["error"],
    });
if (loadEnv().NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
}
//# sourceMappingURL=prisma.js.map