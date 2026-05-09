import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { DataTable, type DataTableColumn } from "../../components/ui/data-table";
import { ROUTES } from "../../constants/routes";
import { listTenantMaintenanceTickets } from "../../services/maintenance.api";

type Row = {
  id: string;
  title: string;
  status: string;
  priority: string;
  updatedAt: string;
};

export function TenantMaintenanceListPage() {
  const q = useQuery({
    queryKey: ["tenant-maintenance-tickets"],
    queryFn: () => listTenantMaintenanceTickets(1, 50),
    refetchInterval: 20_000,
  });

  const columns: Array<DataTableColumn<Row>> = [
    {
      id: "title",
      header: "Request",
      cell: (r) => (
        <Link
          to={`${ROUTES.tenantMaintenance}/${r.id}`}
          className="font-medium text-primary hover:underline"
        >
          {r.title}
        </Link>
      ),
    },
    { id: "pri", header: "Priority", cell: (r) => r.priority },
    {
      id: "status",
      header: "Status",
      cell: (r) => (
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium">{r.status}</span>
      ),
    },
    {
      id: "updated",
      header: "Updated",
      cell: (r) => new Date(r.updatedAt).toLocaleString("en-IN", { dateStyle: "short" }),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Maintenance</h1>
          <p className="text-sm text-slate-600">
            Report issues with photos. Staff gets notified and you can track progress live.
          </p>
        </div>
        <Link
          to={ROUTES.tenantMaintenanceNew}
          className="inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-95"
        >
          New request
        </Link>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <DataTable
          columns={columns}
          rows={(q.data?.items ?? []) as Row[]}
          getRowId={(r) => r.id}
          isLoading={q.isLoading}
          emptyLabel="No requests yet."
        />
      </div>
    </div>
  );
}
