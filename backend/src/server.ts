import "dotenv/config";
import { loadEnv } from "./config/env.js";
import { registerJobs } from "./jobs/index.js";
import { createApp } from "./app.js";
import { logger } from "./services/logger.service.js";

const env = loadEnv();
const app = createApp();

registerJobs();

app.listen(env.PORT, () => {
  logger.info(`API listening on port ${env.PORT}`);
});
