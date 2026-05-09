/**
 * Client-side foundation for Web Push (VAPID subscription + backend persistence
 * still required). Safe to import on the server during SSR? — not used in SSR here.
 */

export type PushFoundationStatus =
  | { ok: true; permission: NotificationPermission }
  | { ok: false; reason: "unsupported" | "no-window" };

export function getPushFoundationStatus(): PushFoundationStatus {
  if (typeof window === "undefined") return { ok: false, reason: "no-window" };
  if (!("Notification" in window) || !("serviceWorker" in navigator)) {
    return { ok: false, reason: "unsupported" };
  }
  return { ok: true, permission: Notification.permission };
}

/**
 * Requests browser notification permission only (no push subscription yet).
 */
export async function requestBrowserNotificationPermission(): Promise<NotificationPermission> {
  if (!("Notification" in window)) return "denied";
  if (Notification.permission === "granted" || Notification.permission === "denied") {
    return Notification.permission;
  }
  return Notification.requestPermission();
}
