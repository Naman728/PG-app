import { useQuery } from "@tanstack/react-query";
import { DataTable, type DataTableColumn } from "../../components/ui/data-table";
import { fetchTenantRentInvoices, type RentInvoiceRow } from "../../services/rent.api";

function formatInr(minor: number) {
  return (minor / 100).toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  });
}

export function TenantRentPage() {
  const q = useQuery({
    queryKey: ["tenant-rent-invoices"],
    queryFn: fetchTenantRentInvoices,
  });

  const columns: Array<DataTableColumn<RentInvoiceRow>> = [
    {
      id: "period",
      header: "Period",
      cell: (r) => (
        <span className="font-medium text-slate-900">
          {r.billingYear}-{String(r.billingMonth).padStart(2, "0")}
        </span>
      ),
    },
    {
      id: "pg",
      header: "Property",
      cell: (r) => (
        <span className="text-sm text-slate-700">{r.organization?.name ?? "—"}</span>
      ),
    },
    {
      id: "unit",
      header: "Unit",
      cell: (r) => (
        <span className="text-sm text-slate-600">
          {r.bed.room.floor.name} · {r.bed.room.name} · {r.bed.label}
        </span>
      ),
    },
    {
      id: "amount",
      header: "Amount",
      cell: (r) => <span className="tabular-nums">{formatInr(r.amountMinor)}</span>,
    },
    {
      id: "due",
      header: "Due",
      cell: (r) => (
        <span className="text-sm">{new Date(r.dueDate).toLocaleDateString("en-IN")}</span>
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: (r) => (
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-800">
          {r.status}
        </span>
      ),
    },
  ];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-xl font-semibold text-slate-900">Rent invoices</h1>
      <p className="mt-1 text-sm text-slate-600">
        Your PG posts monthly charges here. Contact the owner for payment confirmation.
      </p>
      <div className="mt-6">
        <DataTable
          columns={columns}
          rows={q.data?.items ?? []}
          getRowId={(r) => r.id}
          isLoading={q.isLoading}
          emptyLabel="No rent invoices yet."
        />
      </div>
    </div>
  );
}
