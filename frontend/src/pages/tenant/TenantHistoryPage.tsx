import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "../../components/ui/button";
import { fetchTenantHistory } from "../../services/tenant.api";

export function TenantHistoryPage() {
  const [page, setPage] = useState(1);
  const pageSize = 15;
  const q = useQuery({
    queryKey: ["tenant-history", page],
    queryFn: () => fetchTenantHistory(page, pageSize),
  });

  const totalPages = q.data ? Math.max(1, Math.ceil(q.data.total / q.data.pageSize)) : 1;

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
      <h2 className="text-sm font-semibold text-slate-900">Activity history</h2>
      <p className="mt-1 text-xs text-slate-600">Move-in, documents, bed changes, and more.</p>
      {q.isLoading ? (
        <p className="mt-4 text-sm text-slate-500">Loading…</p>
      ) : (
        <ul className="mt-4 space-y-3 text-sm">
          {(q.data?.items ?? []).map((row) => (
            <li key={row.id} className="rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2">
              <div className="font-medium text-slate-900">{row.eventType}</div>
              <div className="text-xs text-slate-500">
                {new Date(row.createdAt).toLocaleString()}
                {row.createdBy ? ` · by ${row.createdBy.name ?? row.createdBy.phone}` : ""}
              </div>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-6 flex items-center justify-between gap-2">
        <Button
          type="button"
          variant="secondary"
          disabled={page <= 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          Previous
        </Button>
        <span className="text-xs text-slate-600">
          Page {page} of {totalPages}
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
  );
}
