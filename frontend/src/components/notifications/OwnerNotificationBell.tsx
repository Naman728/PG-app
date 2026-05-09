import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import {
  fetchInAppNotifications,
  markAllNotificationsReadApi,
  markNotificationReadApi,
} from "../../services/property.api";
import { useSessionQuery } from "../../hooks/useSessionQuery";

export function OwnerNotificationBell() {
  const session = useSessionQuery();
  const orgId = session.data?.primaryOrganization?.id;
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const q = useQuery({
    queryKey: ["in-app-notifications", orgId],
    queryFn: () => fetchInAppNotifications(orgId!, 30),
    enabled: Boolean(orgId) && open,
    refetchInterval: open ? 20_000 : false,
  });

  const countQuery = useQuery({
    queryKey: ["in-app-notifications-count", orgId],
    queryFn: () => fetchInAppNotifications(orgId!, 1),
    enabled: Boolean(orgId),
    refetchInterval: 45_000,
    select: (d) => d.unread,
  });

  if (!orgId) return null;

  const organizationId = orgId;
  const unread = countQuery.data ?? 0;

  async function markRead(id: string) {
    try {
      await markNotificationReadApi(organizationId, id);
      await queryClient.invalidateQueries({ queryKey: ["in-app-notifications", organizationId] });
      await queryClient.invalidateQueries({ queryKey: ["in-app-notifications-count", organizationId] });
    } catch {
      toast.error("Could not update notification");
    }
  }

  async function markAllRead() {
    try {
      await markAllNotificationsReadApi(organizationId);
      toast.success("All marked read");
      await queryClient.invalidateQueries({ queryKey: ["in-app-notifications", organizationId] });
      await queryClient.invalidateQueries({ queryKey: ["in-app-notifications-count", organizationId] });
    } catch {
      toast.error("Could not update notifications");
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-lg border border-white/20 bg-white/5 px-3 py-1.5 text-sm font-medium text-emerald-50 hover:bg-white/10"
        aria-expanded={open}
        aria-label="Notifications"
      >
        Alerts
        {unread > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </button>
      {open ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-30 cursor-default bg-transparent"
            aria-label="Close"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 z-40 mt-2 w-[min(100vw-2rem,22rem)] max-h-[70vh] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl ring-1 ring-black/5">
            <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
              <span className="text-sm font-semibold text-slate-900">Notifications</span>
              {unread > 0 ? (
                <button
                  type="button"
                  className="text-xs font-medium text-primary hover:underline"
                  onClick={() => void markAllRead()}
                >
                  Mark all read
                </button>
              ) : null}
            </div>
            <div className="max-h-[55vh] overflow-y-auto">
              {q.isLoading ? (
                <p className="px-3 py-6 text-center text-sm text-slate-500">Loading…</p>
              ) : !q.data?.items.length ? (
                <p className="px-3 py-6 text-center text-sm text-slate-500">You&apos;re all caught up.</p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {q.data.items.map((n) => (
                    <li key={n.id}>
                      <button
                        type="button"
                        className={[
                          "w-full px-3 py-3 text-left transition hover:bg-slate-50",
                          n.readAt ? "opacity-70" : "bg-amber-50/40",
                        ].join(" ")}
                        onClick={() => {
                          if (!n.readAt) void markRead(n.id);
                        }}
                      >
                        <p className="text-xs font-semibold text-slate-900">{n.title}</p>
                        <p className="mt-1 line-clamp-3 text-xs text-slate-600">{n.body}</p>
                        <p className="mt-1 text-[10px] text-slate-400">
                          {new Date(n.createdAt).toLocaleString()}
                        </p>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="border-t border-slate-100 p-2">
              <Button type="button" variant="secondary" className="w-full text-xs" onClick={() => setOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
