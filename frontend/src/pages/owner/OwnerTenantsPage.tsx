import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";
import { DataTable, type DataTableColumn } from "../../components/ui/data-table";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { ROUTES } from "../../constants/routes";
import { OwnerShell } from "../../layouts/OwnerShell";
import { useSessionQuery } from "../../hooks/useSessionQuery";
import { listOwnerTenants, type OwnerTenantListRow } from "../../services/ownerTenants.api";

const STATUS_OPTIONS = [
  "",
  "ONBOARDING",
  "PENDING_REVIEW",
  "ACTIVE",
  "MOVING_OUT",
  "MOVED_OUT",
  "SUSPENDED",
] as const;

export function OwnerTenantsPage() {
  const session = useSessionQuery();
  const orgId = session.data?.primaryOrganization?.id;
  const [page, setPage] = useState(1);
  const [qInput, setQInput] = useState("");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string | undefined>(undefined);

  const query = useQuery({
    queryKey: ["owner-tenants", orgId, page, q, status],
    queryFn: () =>
      listOwnerTenants(orgId!, {
        page,
        pageSize: 15,
        q: q || undefined,
        status: status || undefined,
      }),
    enabled: Boolean(orgId),
  });

  const columns: Array<DataTableColumn<OwnerTenantListRow>> = [
    {
      id: "user",
      header: "Tenant",
      cell: (r) => (
        <Link
          className="font-medium text-primary hover:underline"
          to={`${ROUTES.ownerTenants}/${r.id}`}
        >
          {r.user.name ?? r.user.phone}
        </Link>
      ),
    },
    { id: "phone", header: "Phone", cell: (r) => r.user.phone },
    { id: "status", header: "Status", cell: (r) => r.status },
    {
      id: "aadhaar",
      header: "Aadhaar",
      cell: (r) => r.aadhaarMasked ?? "—",
    },
    {
      id: "kyc",
      header: "KYC",
      cell: (r) => (r.kycSubmittedAt ? new Date(r.kycSubmittedAt).toLocaleDateString() : "—"),
    },
  ];

  const rows = query.data?.items ?? [];
  const totalPages = query.data
    ? Math.max(1, Math.ceil(query.data.total / query.data.pageSize))
    : 1;

  return (
    <OwnerShell title="Tenants" contentMaxClassName="max-w-6xl">
      {!orgId ? (
        <p className="text-sm text-slate-600">No organization.</p>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-end">
            <label className="min-w-0 flex-1 text-sm">
              <span className="font-medium text-slate-800">Search</span>
              <Input
                value={qInput}
                onChange={(e) => setQInput(e.target.value)}
                placeholder="Name or phone"
                className="mt-1"
              />
            </label>
            <label className="text-sm">
              <span className="font-medium text-slate-800">Status</span>
              <select
                className="mt-1 block h-10 w-full rounded-lg border border-slate-200 px-2 sm:w-48"
                value={status ?? ""}
                onChange={(e) => {
                  setStatus(e.target.value || undefined);
                  setPage(1);
                }}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s || "all"} value={s}>
                    {s || "All statuses"}
                  </option>
                ))}
              </select>
            </label>
            <Button
              type="button"
              onClick={() => {
                setQ(qInput.trim());
                setPage(1);
              }}
            >
              Apply
            </Button>
          </div>

          <DataTable
            columns={columns}
            rows={rows}
            getRowId={(r) => r.id}
            isLoading={query.isLoading}
            emptyLabel="No tenants match your filters."
          />

          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="secondary"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <span className="text-xs text-slate-600">
              Page {page} of {totalPages} · {query.data?.total ?? 0} total
            </span>
            <Button
              type="button"
              variant="secondary"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </OwnerShell>
  );
}
