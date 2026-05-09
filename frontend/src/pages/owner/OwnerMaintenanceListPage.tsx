import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";
import { DataTable, type DataTableColumn } from "../../components/ui/data-table";
import { useSessionQuery } from "../../hooks/useSessionQuery";
import { OwnerShell } from "../../layouts/OwnerShell";
import { ROUTES } from "../../constants/routes";
import {
  fetchMaintenanceMetrics,
  fetchMaintenanceTickets,
} from "../../services/maintenance.api";

type TicketRow = {
  id: string;
  title: string;
  status: string;
  priority: string;
  category: string;
  updatedAt: string;
  tenant: { name: string | null; phone: string };
  assignee: { name: string | null } | null;
};

export function OwnerMaintenanceListPage() {
  const session = useSessionQuery();
  const orgId = session.data?.primaryOrganization?.id;
  const [statusFilter, setStatusFilter] = useState<string>("");

  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);

  const metricsQuery = useQuery({
    queryKey: ["maintenance-metrics", orgId, from.toISOString(), to.toISOString()],
    queryFn: () =>
      fetchMaintenanceMetrics(orgId!, {
        from: from.toISOString(),
        to: to.toISOString(),
      }),
    enabled: Boolean(orgId),
    refetchInterval: 25_000,
  });

  const ticketsQuery = useQuery({
    queryKey: ["maintenance-tickets", orgId, statusFilter],
    queryFn: () =>
      fetchMaintenanceTickets(orgId!, {
        page: 1,
        pageSize: 50,
        status: statusFilter
          ? (statusFilter as "OPEN" | "ACKNOWLEDGED" | "IN_PROGRESS" | "BLOCKED" | "RESOLVED" | "CLOSED")
          : undefined,
      }),
    enabled: Boolean(orgId),
    refetchInterval: 20_000,
  });

  const columns: Array<DataTableColumn<TicketRow>> = [
    {
      id: "title",
      header: "Ticket",
      cell: (r) => (
        <Link
          to={`${ROUTES.ownerMaintenance}/${r.id}`}
          className="font-medium text-primary hover:underline"
        >
          {r.title}
        </Link>
      ),
    },
    { id: "tenant", header: "Tenant", cell: (r) => r.tenant.name ?? r.tenant.phone },
    {
      id: "assignee",
      header: "Assignee",
      cell: (r) => r.assignee?.name ?? "—",
    },
    { id: "cat", header: "Category", cell: (r) => r.category },
    { id: "pri", header: "Priority", cell: (r) => r.priority },
    {
      id: "status",
      header: "Status",
      cell: (r) => (
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-800">
          {r.status}
        </span>
      ),
    },
    {
      id: "updated",
      header: "Updated",
      cell: (r) => new Date(r.updatedAt).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" }),
    },
  ];

  if (!orgId) {
    return (
      <OwnerShell title="Maintenance">
        <p className="text-sm text-slate-600">No organization in session.</p>
      </OwnerShell>
    );
  }

  const m = metricsQuery.data;

  return (
    <OwnerShell title="Maintenance" contentMaxClassName="max-w-7xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-xl text-sm text-slate-600">
          Triage issues, assign staff, and close the loop. Timeline and notifications keep everyone aligned.
        </p>
        <Link
          to={ROUTES.owner}
          className="inline-flex rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
        >
          Back to overview
        </Link>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-slate-500">Quick filter</span>
        <select
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All statuses</option>
          {["OPEN", "ACKNOWLEDGED", "IN_PROGRESS", "BLOCKED", "RESOLVED", "CLOSED"].map((s) => (
            <option key={s} value={s}>
              {s.replaceAll("_", " ")}
            </option>
          ))}
        </select>
      </div>

      {m ? (
        <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="Resolved (30d)" value={String(m.resolvedCount)} hint="Closed in range" />
          <Metric
            label="Avg. resolution"
            value={m.avgResolutionHours != null ? `${m.avgResolutionHours.toFixed(1)} h` : "—"}
            hint="Hours to resolve"
          />
          <Metric
            label="Avg. cost"
            value={
              m.avgCostMinor != null
                ? `₹ ${(m.avgCostMinor / 100).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`
                : "—"
            }
            hint="Recorded spend"
          />
          <Metric
            label="Avg. rating"
            value={m.avgRating != null ? m.avgRating.toFixed(1) : "—"}
            hint="Tenant feedback"
          />
        </div>
      ) : null}

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Open pipeline</h2>
        <DataTable
          columns={columns}
          rows={(ticketsQuery.data?.items ?? []) as TicketRow[]}
          getRowId={(r) => r.id}
          isLoading={ticketsQuery.isLoading}
          emptyLabel="No tickets yet. Tenants can raise requests from their portal."
        />
      </div>
    </OwnerShell>
  );
}

function Metric(props: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4 shadow-sm">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{props.label}</div>
      <div className="mt-1 text-xl font-semibold text-slate-900">{props.value}</div>
      <div className="mt-1 text-xs text-slate-500">{props.hint}</div>
    </div>
  );
}
