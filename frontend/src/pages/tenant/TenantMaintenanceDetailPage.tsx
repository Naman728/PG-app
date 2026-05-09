import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { ROUTES } from "../../constants/routes";
import {
  fetchTenantMaintenanceTicket,
  fetchTenantMaintenanceTimeline,
  postTenantMaintenanceAttachment,
  postTenantMaintenanceMessage,
  postTenantMaintenanceRating,
} from "../../services/maintenance.api";

export function TenantMaintenanceDetailPage() {
  const { ticketId } = useParams<{ ticketId: string }>();
  const queryClient = useQueryClient();
  const [msg, setMsg] = useState("");
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState("");

  const ticketQuery = useQuery({
    queryKey: ["tenant-maintenance-ticket", ticketId],
    queryFn: () => fetchTenantMaintenanceTicket(ticketId!),
    enabled: Boolean(ticketId),
    refetchInterval: 12_000,
  });

  const timelineQuery = useQuery({
    queryKey: ["tenant-maintenance-timeline", ticketId],
    queryFn: () => fetchTenantMaintenanceTimeline(ticketId!),
    enabled: Boolean(ticketId),
    refetchInterval: 12_000,
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["tenant-maintenance-ticket", ticketId] });
    void queryClient.invalidateQueries({ queryKey: ["tenant-maintenance-timeline", ticketId] });
    void queryClient.invalidateQueries({ queryKey: ["tenant-maintenance-tickets"] });
  };

  const msgMutation = useMutation({
    mutationFn: () =>
      postTenantMaintenanceMessage(ticketId!, { body: msg, visibility: "TENANT" }),
    onSuccess: () => {
      toast.success("Sent");
      setMsg("");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => postTenantMaintenanceAttachment(ticketId!, file),
    onSuccess: () => {
      toast.success("Photo uploaded");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rateMutation = useMutation({
    mutationFn: () => postTenantMaintenanceRating(ticketId!, { rating, feedback: feedback || null }),
    onSuccess: () => {
      toast.success("Thanks for the feedback");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const ticket = ticketQuery.data?.ticket as
    | {
        title: string;
        description: string;
        status: string;
        resolutionRating: number | null;
      }
    | undefined;

  if (!ticketId) {
    return <p className="text-sm text-slate-600">Missing ticket.</p>;
  }

  const canRate =
    ticket &&
    (ticket.status === "RESOLVED" || ticket.status === "CLOSED") &&
    ticket.resolutionRating == null;

  return (
    <div className="space-y-6">
      <Link to={ROUTES.tenantMaintenance} className="text-sm font-medium text-primary hover:underline">
        ← All requests
      </Link>
      {ticket ? (
        <>
          <div>
            <h1 className="text-xl font-semibold text-slate-900">{ticket.title}</h1>
            <p className="mt-2 text-sm text-slate-700 whitespace-pre-wrap">{ticket.description}</p>
            <p className="mt-2 text-xs text-slate-500">Status: {ticket.status}</p>
          </div>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">Activity</h2>
            <ul className="mt-3 max-h-80 space-y-2 overflow-y-auto text-sm">
              {(timelineQuery.data?.entries ?? []).map((e, i) => (
                <li key={`${e.kind}-${i}`} className="rounded-lg border border-slate-100 bg-slate-50/80 p-2">
                  <div className="text-xs text-slate-500">
                    {new Date(e.createdAt).toLocaleString("en-IN")}
                  </div>
                  {e.kind === "message" ? (
                    <p className="mt-1 text-slate-800 whitespace-pre-wrap">
                      {(e.data as { body?: string }).body}
                    </p>
                  ) : (
                    <p className="mt-1 font-medium text-slate-900">
                      {(e.data as { activityType?: string }).activityType}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">Message staff</h2>
            <textarea
              className="mt-2 w-full rounded-lg border border-slate-200 p-2 text-sm"
              rows={3}
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
            />
            <Button
              type="button"
              className="mt-2"
              disabled={!msg.trim() || msgMutation.isPending}
              onClick={() => msgMutation.mutate()}
            >
              Send
            </Button>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">Add photo</h2>
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
          </section>

          {canRate ? (
            <section className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-emerald-900">How did we do?</h2>
              <label className="mt-2 block text-sm text-emerald-900">
                Rating (1–5)
                <Input
                  type="number"
                  min={1}
                  max={5}
                  className="mt-1 w-24"
                  value={rating}
                  onChange={(e) => setRating(Number(e.target.value))}
                />
              </label>
              <label className="mt-2 block text-sm text-emerald-900">
                Optional feedback
                <textarea
                  className="mt-1 w-full rounded-lg border border-emerald-200 p-2 text-sm"
                  rows={2}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                />
              </label>
              <Button type="button" className="mt-3" onClick={() => rateMutation.mutate()}>
                Submit rating
              </Button>
            </section>
          ) : null}

          {ticket.resolutionRating != null ? (
            <p className="text-sm text-slate-600">
              Your rating: <span className="font-semibold">{ticket.resolutionRating}/5</span>
            </p>
          ) : null}
        </>
      ) : (
        <p className="text-sm text-slate-500">Loading…</p>
      )}
    </div>
  );
}
