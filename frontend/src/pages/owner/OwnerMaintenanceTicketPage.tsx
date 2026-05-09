import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import type { MaintenanceTicketStatusBody } from "@pg-manager/shared";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { ROUTES } from "../../constants/routes";
import { useSessionQuery } from "../../hooks/useSessionQuery";
import { OwnerShell } from "../../layouts/OwnerShell";
import {
  fetchMaintenanceStaff,
  fetchMaintenanceTicket,
  fetchMaintenanceTimeline,
  patchMaintenanceTicket,
  postMaintenanceAttachment,
  postMaintenanceMessage,
  postMaintenanceStatus,
} from "../../services/maintenance.api";

export function OwnerMaintenanceTicketPage() {
  const { ticketId } = useParams<{ ticketId: string }>();
  const session = useSessionQuery();
  const orgId = session.data?.primaryOrganization?.id;
  const queryClient = useQueryClient();
  const [msg, setMsg] = useState("");
  const [internalOnly, setInternalOnly] = useState(false);
  /** Local cost field; scoped by org + ticket so navigation does not need effects. */
  const [costDraft, setCostDraft] = useState<{ key: string; value: string } | null>(null);

  const ticketQuery = useQuery({
    queryKey: ["maintenance-ticket", orgId, ticketId],
    queryFn: () => fetchMaintenanceTicket(orgId!, ticketId!),
    enabled: Boolean(orgId && ticketId),
    refetchInterval: 12_000,
  });

  const timelineQuery = useQuery({
    queryKey: ["maintenance-timeline", orgId, ticketId],
    queryFn: () => fetchMaintenanceTimeline(orgId!, ticketId!),
    enabled: Boolean(orgId && ticketId),
    refetchInterval: 12_000,
  });

  const staffQuery = useQuery({
    queryKey: ["maintenance-staff", orgId],
    queryFn: () => fetchMaintenanceStaff(orgId!),
    enabled: Boolean(orgId),
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["maintenance-ticket", orgId, ticketId] });
    void queryClient.invalidateQueries({ queryKey: ["maintenance-timeline", orgId, ticketId] });
    void queryClient.invalidateQueries({ queryKey: ["maintenance-tickets", orgId] });
  };

  const statusMutation = useMutation({
    mutationFn: (body: MaintenanceTicketStatusBody) =>
      postMaintenanceStatus(orgId!, ticketId!, body),
    onSuccess: () => {
      toast.success("Status updated");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const assignMutation = useMutation({
    mutationFn: (assignedToUserId: string | null) =>
      patchMaintenanceTicket(orgId!, ticketId!, { assignedToUserId }),
    onSuccess: () => {
      toast.success("Assignment saved");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const costMutation = useMutation({
    mutationFn: (resolutionCostMinor: number | null) =>
      patchMaintenanceTicket(orgId!, ticketId!, { resolutionCostMinor }),
    onSuccess: () => {
      toast.success("Cost saved");
      setCostDraft(null);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const messageMutation = useMutation({
    mutationFn: () =>
      postMaintenanceMessage(orgId!, ticketId!, {
        body: msg,
        visibility: internalOnly ? "INTERNAL" : "TENANT",
      }),
    onSuccess: () => {
      toast.success("Posted");
      setMsg("");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => postMaintenanceAttachment(orgId!, ticketId!, file),
    onSuccess: () => {
      toast.success("Photo added");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const ticket = ticketQuery.data?.ticket as
    | {
        title: string;
        description: string;
        status: string;
        priority: string;
        category: string;
        tenant: { name: string | null; phone: string };
        assignee: { id: string; name: string | null } | null;
        resolutionCostMinor: number | null;
        resolutionRating: number | null;
        resolutionFeedback: string | null;
        attachments: Array<{ id: string; originalFilename: string }>;
      }
    | undefined;

  const ticketKey = `${orgId}:${ticketId}`;
  const serverCostStr =
    ticket?.resolutionCostMinor != null ? String(ticket.resolutionCostMinor / 100) : "";
  const cost =
    costDraft && costDraft.key === ticketKey ? costDraft.value : serverCostStr;

  if (!orgId || !ticketId) {
    return (
      <OwnerShell title="Ticket">
        <p className="text-sm text-slate-600">Missing ticket.</p>
      </OwnerShell>
    );
  }

  return (
    <OwnerShell title={ticket?.title ?? "Ticket"} contentMaxClassName="max-w-7xl">
      <div className="mb-4">
        <Link to={ROUTES.ownerMaintenance} className="text-sm font-medium text-primary hover:underline">
          ← All tickets
        </Link>
      </div>

      {ticket ? (
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="space-y-4 lg:col-span-3">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-800">
                  {ticket.status}
                </span>
                <span className="rounded-full bg-amber-50 px-2 py-0.5 font-medium text-amber-900">
                  {ticket.priority}
                </span>
                <span className="rounded-full bg-sky-50 px-2 py-0.5 font-medium text-sky-900">
                  {ticket.category}
                </span>
              </div>
              <p className="mt-3 text-sm text-slate-700 whitespace-pre-wrap">{ticket.description}</p>
              <p className="mt-2 text-xs text-slate-500">
                Tenant: {ticket.tenant.name ?? ticket.tenant.phone}
              </p>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-900">Timeline</h2>
              <ul className="mt-4 max-h-[480px] space-y-3 overflow-y-auto pr-1">
                {(timelineQuery.data?.entries ?? []).map((e, i) => (
                  <li
                    key={`${e.kind}-${i}-${e.createdAt}`}
                    className="rounded-xl border border-slate-100 bg-slate-50/80 p-3 text-sm"
                  >
                    <div className="text-xs text-slate-500">
                      {new Date(e.createdAt).toLocaleString("en-IN")}
                    </div>
                    {e.kind === "activity" ? (
                      <div className="mt-1 font-medium text-slate-900">
                        {(e.data as { activityType?: string }).activityType ?? "Activity"}
                      </div>
                    ) : (
                      <div className="mt-1">
                        <span className="font-medium text-slate-900">
                          {(e.data as { author?: { name?: string | null } }).author?.name ?? "User"}
                        </span>
                        <span className="ml-2 text-xs text-slate-500">
                          {(e.data as { visibility?: string }).visibility === "INTERNAL"
                            ? "Internal"
                            : "Shared with tenant"}
                        </span>
                        <p className="mt-1 text-slate-700 whitespace-pre-wrap">
                          {String((e.data as { body?: string }).body ?? "")}
                        </p>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <div className="space-y-4 lg:col-span-2">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-900">Workflow</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {(
                  [
                    "ACKNOWLEDGED",
                    "IN_PROGRESS",
                    "BLOCKED",
                    "RESOLVED",
                    "CLOSED",
                  ] as const satisfies readonly MaintenanceTicketStatusBody["status"][]
                ).map((s) => (
                  <Button
                    key={s}
                    type="button"
                    variant="secondary"
                    className="px-2 py-1 text-xs"
                    disabled={statusMutation.isPending}
                    onClick={() => {
                      if (s === "RESOLVED") {
                        const summary = window.prompt("Resolution summary (optional)", "");
                        void statusMutation.mutateAsync({
                          status: s,
                          resolutionSummary: summary || undefined,
                        });
                      } else {
                        void statusMutation.mutateAsync({ status: s });
                      }
                    }}
                  >
                    {s.replace("_", " ")}
                  </Button>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-900">Assignee</h2>
              <select
                className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                value={ticket.assignee?.id ?? ""}
                onChange={(e) =>
                  assignMutation.mutate(e.target.value === "" ? null : e.target.value)
                }
              >
                <option value="">Unassigned</option>
                {(staffQuery.data?.staff ?? []).map((s) => (
                  <option key={s.userId} value={s.userId}>
                    {s.user.name ?? s.user.phone} ({s.orgRole})
                  </option>
                ))}
              </select>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-900">Maintenance cost (₹)</h2>
              <div className="mt-2 flex gap-2">
                <Input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 1200"
                  value={cost}
                  onChange={(e) => setCostDraft({ key: ticketKey, value: e.target.value })}
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() =>
                    costMutation.mutate(cost.trim() === "" ? null : Math.round(Number(cost) * 100))
                  }
                >
                  Save
                </Button>
              </div>
              {ticket.resolutionCostMinor != null ? (
                <p className="mt-2 text-xs text-slate-500">
                  Current: ₹{(ticket.resolutionCostMinor / 100).toLocaleString("en-IN")}
                </p>
              ) : null}
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-900">Notes & replies</h2>
              <textarea
                className="mt-2 w-full rounded-lg border border-slate-200 p-2 text-sm"
                rows={3}
                value={msg}
                onChange={(e) => setMsg(e.target.value)}
                placeholder="Update the team or reply to the tenant…"
              />
              <label className="mt-2 flex items-center gap-2 text-xs text-slate-600">
                <input
                  type="checkbox"
                  checked={internalOnly}
                  onChange={(e) => setInternalOnly(e.target.checked)}
                />
                Internal only (not visible to tenant)
              </label>
              <Button
                type="button"
                className="mt-2"
                disabled={!msg.trim() || messageMutation.isPending}
                onClick={() => messageMutation.mutate()}
              >
                Post
              </Button>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-900">Photos</h2>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="mt-2 text-sm"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) uploadMutation.mutate(f);
                  e.target.value = "";
                }}
              />
              <ul className="mt-2 text-xs text-slate-600">
                {ticket.attachments.map((a) => (
                  <li key={a.id}>{a.originalFilename}</li>
                ))}
              </ul>
            </section>

            {ticket.resolutionRating != null ? (
              <section className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-5">
                <h2 className="text-sm font-semibold text-emerald-900">Tenant rating</h2>
                <p className="mt-1 text-2xl font-semibold text-emerald-900">{ticket.resolutionRating} / 5</p>
                {ticket.resolutionFeedback ? (
                  <p className="mt-2 text-sm text-emerald-900/90">{ticket.resolutionFeedback}</p>
                ) : null}
              </section>
            ) : null}
          </div>
        </div>
      ) : (
        <p className="text-sm text-slate-500">Loading…</p>
      )}
    </OwnerShell>
  );
}
