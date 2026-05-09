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
        className={[
          "relative min-h-10 rounded-lg border-2 px-3 py-2 text-sm font-semibold shadow-sm transition",
          "border-white/50 bg-white/20 text-white ring-1 ring-white/25",
          "hover:bg-white/30 hover:ring-white/40",
          open ? "bg-white/35 ring-white/50" : "",
        ].join(" ")}
        aria-expanded={open}
        aria-label="Notifications"
      >
        Alerts
        {unread > 0 ? (
          <span className="absolute -right-1.5 -top-1.5 flex h-6 min-w-6 items-center justify-center rounded-full border-2 border-white bg-rose-600 px-1 text-[11px] font-bold text-white shadow-md">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </button>
      {open ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[10040] cursor-default bg-black/20 backdrop-blur-[1px]"
            aria-label="Close"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 z-[10050] mt-2 w-[min(100vw-2rem,24rem)] max-h-[75vh] overflow-hidden rounded-xl border-2 border-slate-300 bg-white shadow-2xl ring-2 ring-slate-900/10">
            <div className="flex items-center justify-between border-b-2 border-slate-200 bg-slate-50 px-4 py-3">
              <span className="text-base font-bold text-slate-900">Notifications</span>
              {unread > 0 ? (
                <button
                  type="button"
                  className="text-sm font-semibold text-[#0f6e56] hover:underline"
                  onClick={() => void markAllRead()}
                >
                  Mark all read
                </button>
              ) : null}
            </div>
            <div className="max-h-[58vh] overflow-y-auto">
              {q.isLoading ? (
                <p className="px-4 py-8 text-center text-base text-slate-600">Loading…</p>
              ) : !q.data?.items.length ? (
                <p className="px-4 py-8 text-center text-base text-slate-600">You&apos;re all caught up.</p>
              ) : (
                <ul className="divide-y divide-slate-200">
                  {q.data.items.map((n) => (
                    <li key={n.id}>
                      <button
                        type="button"
                        className={[
                          "w-full px-4 py-4 text-left transition",
                          n.readAt ? "bg-white opacity-80 hover:bg-slate-50" : "bg-amber-100 hover:bg-amber-50",
                        ].join(" ")}
                        onClick={() => {
                          if (!n.readAt) void markRead(n.id);
                        }}
                      >
                        <p className="text-sm font-bold text-slate-900">{n.title}</p>
                        <p className="mt-1.5 line-clamp-4 text-sm leading-relaxed text-slate-800">{n.body}</p>
                        <p className="mt-2 text-xs font-medium text-slate-500">
                          {new Date(n.createdAt).toLocaleString()}
                        </p>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="border-t-2 border-slate-200 bg-slate-50 p-3">
              <Button type="button" variant="secondary" className="h-11 w-full text-sm font-semibold" onClick={() => setOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
