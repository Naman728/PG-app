import cron from "node-cron";
import { logger } from "../services/logger.service.js";
import {
  drainNotificationQueue,
  reclaimStaleProcessingJobs,
} from "../modules/rent/notification-queue.service.js";
import {
  generateCurrentMonthForAllOrgs,
  markOverdueInvoicesGlobally,
  runRentReminderSweepAllOrgs,
} from "../modules/rent/rent.service.js";

let started = false;

async function queueTick(): Promise<void> {
  try {
    await reclaimStaleProcessingJobs();
    const n = await drainNotificationQueue(40);
    if (n > 0) {
      logger.info({ message: "notification_queue_drained", processed: n });
    }
  } catch (err) {
    logger.error({ message: "rent_queue_tick_failed", err });
  }
}

async function hourlySweep(): Promise<void> {
  try {
    await markOverdueInvoicesGlobally();
    await runRentReminderSweepAllOrgs();
  } catch (err) {
    logger.error({ message: "rent_hourly_sweep_failed", err });
  }
}

async function monthlyGeneration(): Promise<void> {
  try {
    await generateCurrentMonthForAllOrgs();
  } catch (err) {
    logger.error({ message: "rent_monthly_generation_failed", err });
  }
}

export function registerRentCronJobs(): void {
  if (started) return;
  if (process.env.DISABLE_RENT_CRON === "1") {
    logger.warn("rent_cron_disabled_via_env");
    return;
  }
  started = true;

  cron.schedule("* * * * *", () => {
    void queueTick();
  });

  cron.schedule("5 * * * *", () => {
    void hourlySweep();
  });

  cron.schedule("0 6 1 * *", () => {
    void monthlyGeneration();
  }, { timezone: "Asia/Kolkata" });

  void queueTick();
  logger.info({ message: "rent_cron_registered" });
}
