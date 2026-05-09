import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import type { OwnerReviewDocumentInput, OwnerUpdateTenantInput } from "@pg-manager/shared";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { ROUTES } from "../../constants/routes";
import { OwnerShell } from "../../layouts/OwnerShell";
import { useSessionQuery } from "../../hooks/useSessionQuery";
import {
  getOwnerTenantDetail,
  getOwnerTenantDocumentSignedUrl,
  getOwnerTenantHistory,
  patchOwnerTenant,
  reviewOwnerTenantDocument,
} from "../../services/ownerTenants.api";

type WorkflowForm = {
  status: string;
  moveIn: string;
  moveOut: string;
  note: string;
};

export function OwnerTenantDetailPage() {
  const { tenantId } = useParams<{ tenantId: string }>();
  const qc = useQueryClient();
  const session = useSessionQuery();
  const orgId = session.data?.primaryOrganization?.id;

  const detail = useQuery({
    queryKey: ["owner-tenant", orgId, tenantId],
    queryFn: () => getOwnerTenantDetail(orgId!, tenantId!),
    enabled: Boolean(orgId && tenantId),
  });

  const [histPage, setHistPage] = useState(1);
  const history = useQuery({
    queryKey: ["owner-tenant-history", orgId, tenantId, histPage],
    queryFn: () => getOwnerTenantHistory(orgId!, tenantId!, histPage, 12),
    enabled: Boolean(orgId && tenantId),
  });

  const wf = useForm<WorkflowForm>({
    values: detail.data
      ? {
          status: detail.data.tenant.status,
          moveIn: detail.data.tenant.moveInAt
            ? detail.data.tenant.moveInAt.slice(0, 10)
            : "",
          moveOut: detail.data.tenant.moveOutAt
            ? detail.data.tenant.moveOutAt.slice(0, 10)
            : "",
          note: detail.data.tenant.statusNote ?? "",
        }
      : { status: "", moveIn: "", moveOut: "", note: "" },
  });

  const patchMut = useMutation({
    mutationFn: (body: OwnerUpdateTenantInput) => patchOwnerTenant(orgId!, tenantId!, body),
    onSuccess: async () => {
      toast.success("Tenant updated");
      await qc.invalidateQueries({ queryKey: ["owner-tenant", orgId, tenantId] });
      await qc.invalidateQueries({ queryKey: ["owner-tenants", orgId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const reviewMut = useMutation({
    mutationFn: ({
      documentId,
      body,
    }: {
      documentId: string;
      body: OwnerReviewDocumentInput;
    }) => reviewOwnerTenantDocument(orgId!, documentId, body),
    onSuccess: async () => {
      toast.success("Document updated");
      await qc.invalidateQueries({ queryKey: ["owner-tenant", orgId, tenantId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function viewDoc(documentId: string) {
    try {
      const { url } = await getOwnerTenantDocumentSignedUrl(orgId!, documentId);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  const histTotalPages = history.data
    ? Math.max(1, Math.ceil(history.data.total / history.data.pageSize))
    : 1;

  return (
    <OwnerShell title="Tenant detail" contentMaxClassName="max-w-6xl">
      <div className="mb-4">
        <Link to={ROUTES.ownerTenants} className="text-sm font-medium text-primary hover:underline">
          ← Back to tenants
        </Link>
      </div>
      {!orgId || !tenantId ? null : detail.isLoading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : detail.isError ? (
        <p className="text-sm text-red-700">{(detail.error as Error).message}</p>
      ) : detail.data ? (
        <div className="space-y-6">
          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">Profile</h2>
            <p className="mt-2 text-sm text-slate-700">
              {detail.data.user.name ?? "—"} · {detail.data.user.phone}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Aadhaar: {detail.data.tenant.aadhaarMasked ?? "—"}
            </p>
            {detail.data.bedAssignment ? (
              <p className="mt-2 text-sm text-slate-700">
                Bed: {detail.data.bedAssignment.floor.name} / {detail.data.bedAssignment.room.name}{" "}
                / {detail.data.bedAssignment.label}
              </p>
            ) : (
              <p className="mt-2 text-sm text-slate-500">No bed assigned.</p>
            )}
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">Status workflow</h2>
            <form
              className="mt-3 grid gap-3 sm:grid-cols-2"
              onSubmit={wf.handleSubmit((vals) => {
                const body: OwnerUpdateTenantInput = {
                  status: vals.status as OwnerUpdateTenantInput["status"],
                  statusNote: vals.note || null,
                };
                if (vals.moveIn) body.moveInAt = `${vals.moveIn}T12:00:00.000Z`;
                if (vals.moveOut) body.moveOutAt = `${vals.moveOut}T12:00:00.000Z`;
                patchMut.mutate(body);
              })}
            >
              <label className="text-xs font-medium sm:col-span-2">
                Status
                <select
                  className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-2"
                  {...wf.register("status")}
                >
                  {[
                    "ONBOARDING",
                    "PENDING_REVIEW",
                    "ACTIVE",
                    "MOVING_OUT",
                    "MOVED_OUT",
                    "SUSPENDED",
                  ].map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs font-medium">
                Move-in
                <Input type="date" className="mt-1" {...wf.register("moveIn")} />
              </label>
              <label className="text-xs font-medium">
                Move-out
                <Input type="date" className="mt-1" {...wf.register("moveOut")} />
              </label>
              <label className="text-xs font-medium sm:col-span-2">
                Note to tenant (e.g. rejection reason)
                <textarea
                  className="mt-1 min-h-[72px] w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  {...wf.register("note")}
                />
              </label>
              <div className="sm:col-span-2">
                <Button type="submit" disabled={patchMut.isPending}>
                  Save workflow
                </Button>
              </div>
            </form>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">Documents</h2>
            <ul className="mt-3 divide-y divide-slate-100 text-sm">
              {detail.data.documents.map((d) => (
                <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <div>
                    <div className="font-medium">{d.originalFilename}</div>
                    <div className="text-xs text-slate-500">
                      {d.category} · {d.reviewStatus}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="secondary" className="text-xs" onClick={() => void viewDoc(d.id)}>
                      View
                    </Button>
                    <Button
                      type="button"
                      className="text-xs"
                      disabled={reviewMut.isPending}
                      onClick={() =>
                        reviewMut.mutate({ documentId: d.id, body: { reviewStatus: "APPROVED" } })
                      }
                    >
                      Approve
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      className="text-xs text-red-800"
                      disabled={reviewMut.isPending}
                      onClick={() =>
                        reviewMut.mutate({
                          documentId: d.id,
                          body: { reviewStatus: "REJECTED", reviewNote: "Please re-upload a clearer image." },
                        })
                      }
                    >
                      Reject
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">History</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {(history.data?.items ?? []).map((h) => (
                <li key={h.id} className="rounded-lg bg-slate-50 px-3 py-2">
                  <div className="font-medium">{h.eventType}</div>
                  <div className="text-xs text-slate-500">{new Date(h.createdAt).toLocaleString()}</div>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex justify-between">
              <Button
                type="button"
                variant="secondary"
                disabled={histPage <= 1}
                onClick={() => setHistPage((p) => Math.max(1, p - 1))}
              >
                Prev
              </Button>
              <span className="text-xs text-slate-600">
                {histPage} / {histTotalPages}
              </span>
              <Button
                type="button"
                variant="secondary"
                disabled={histPage >= histTotalPages}
                onClick={() => setHistPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </section>
        </div>
      ) : null}
    </OwnerShell>
  );
}
