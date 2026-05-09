import { registerRentCronJobs } from "./rent-cron.js";

/**
 * Background jobs (rent reminders, notification queue, etc.).
 */
export function registerJobs(): void {
  registerRentCronJobs();
}
