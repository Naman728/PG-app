import pino from "pino";
import { loadEnv } from "../config/env.js";
const env = loadEnv();
export const logger = pino({
    level: env.NODE_ENV === "development" ? "debug" : "info",
    redact: {
        paths: ["req.headers.authorization", "req.headers.cookie"],
        remove: true,
    },
});
//# sourceMappingURL=logger.js.map