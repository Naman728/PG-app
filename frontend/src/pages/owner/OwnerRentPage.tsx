import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  bulkRemindRentDto,
  confirmRentPaymentDto,
  updateRentReminderSettingsDto,
} from "@pg-manager/shared";
import type { z } from "zod";
import { DataTable, type DataTableColumn } from "../../components/ui/data-table";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { useSessionQuery } from "../../hooks/useSessionQuery";
import { OwnerShell } from "../../layouts/OwnerShell";
import {
  bulkRemindRentApi,
  confirmRentPaymentApi,
  downloadRentExcel,
  fetchRentDashboard,
  fetchRentInvoices,
  fetchRentNotifications,
  fetchRentReceiptBlob,
  fetchRentSettings,
  generateRentMonthApi,
  patchRentSettings,
  type RentInvoiceRow,
} from "../../services/rent.api";

function formatInr(minor: number) {
  return (minor / 100).toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  });
}

type SettingsForm = z.infer<typeof updateRentReminderSettingsDto>;
type ConfirmForm = z.infer<typeof confirmRentPaymentDto>;

export function OwnerRentPage() {
  const queryClient = useQueryClient();
  const session = useSessionQuery();
  const orgId = session.data?.primaryOrganization?.id;

  const now = useMemo(() => new Date(), []);
  const [year, setYear] = useState(now.getUTCFullYear());
  const [month, setMonth] = useState(now.getUTCMonth() + 1);
  const [tab, setTab] = useState<"invoices" | "activity">("invoices");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmInvoice, setConfirmInvoice] = useState<RentInvoiceRow | null>(null);

  const settingsForm = useForm<SettingsForm>({
    resolver: zodResolver(updateRentReminderSettingsDto),
  });

  const dashboardQuery = useQuery({
    queryKey: ["rent-dashboard", orgId, year, month],
    queryFn: () => fetchRentDashboard(orgId!, year, month),
    enabled: Boolean(orgId),
  });

  const invoicesQuery = useQuery({
    queryKey: ["rent-invoices", orgId, year, month, statusFilter],
    queryFn: () =>
      fetchRentInvoices(orgId!, {
        page: 1,
        pageSize: 100,
        billingYear: year,
        billingMonth: month,
        status: statusFilter
          ? (statusFilter as "DUE" | "PAID" | "OVERDUE" | "WAIVED")
          : undefined,
      }),
    enabled: Boolean(orgId),
  });

  const settingsQuery = useQuery({
    queryKey: ["rent-settings", orgId],
    queryFn: () => fetchRentSettings(orgId!),
    enabled: Boolean(orgId),
  });

  useEffect(() => {
    const s = settingsQuery.data?.settings;
    if (s) settingsForm.reset(s);
  }, [settingsQuery.data, settingsForm]);

  const notificationsQuery = useQuery({
    queryKey: ["rent-notifications", orgId],
    queryFn: () => fetchRentNotifications(orgId!, 1),
    enabled: Boolean(orgId) && tab === "activity",
  });

  const patchSettingsMutation = useMutation({
    mutationFn: (body: SettingsForm) => patchRentSettings(orgId!, body),
    onSuccess: async () => {
      toast.success("Reminder settings saved");
      await queryClient.invalidateQueries({ queryKey: ["rent-settings", orgId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const generateMutation = useMutation({
    mutationFn: () => generateRentMonthApi(orgId!, year, month),
    onSuccess: async (r) => {
      toast.success(`Generated ${r.created} invoice(s); ${r.skipped} skipped`);
      await queryClient.invalidateQueries({ queryKey: ["rent-invoices", orgId] });
      await queryClient.invalidateQueries({ queryKey: ["rent-dashboard", orgId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const bulkMutation = useMutation({
    mutationFn: (ids: string[]) => {
      const parsed = bulkRemindRentDto.parse({ invoiceIds: ids });
      return bulkRemindRentApi(orgId!, parsed);
    },
    onSuccess: async (r) => {
      toast.success(`Queued ${r.enqueued} reminder(s)`);
      setSelected(new Set());
      await queryClient.invalidateQueries({ queryKey: ["rent-notifications", orgId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const exportMutation = useMutation({
    mutationFn: async () => {
      const blob = await downloadRentExcel(orgId!, {
        page: 1,
        pageSize: 500,
        billingYear: year,
        billingMonth: month,
        status: statusFilter
          ? (statusFilter as "DUE" | "PAID" | "OVERDUE" | "WAIVED")
          : undefined,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `rent-${year}-${String(month).padStart(2, "0")}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const dash = dashboardQuery.data;

  const eligibleRows = (invoicesQuery.data?.items ?? []).filter(
    (r) => r.status === "DUE" || r.status === "OVERDUE",
  );
  const allEligibleSelected =
    eligibleRows.length > 0 && eligibleRows.every((r) => selected.has(r.id));

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  function toggleSelectAllOnPage() {
    if (eligibleRows.length === 0) return;
    setSelected(() => {
      if (allEligibleSelected) return new Set();
      return new Set(eligibleRows.map((r) => r.id));
    });
  }

  async function openReceipt(inv: RentInvoiceRow) {
    if (inv.status !== "PAID") return;
    try {
      const blob = await fetchRentReceiptBlob(orgId!, inv.id);
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not open receipt");
    }
  }

  const columns: Array<DataTableColumn<RentInvoiceRow>> = [
    {
      id: "sel",
      header: " ",
      cell: (r) =>
        r.status === "DUE" || r.status === "OVERDUE" ? (
          <input
            type="checkbox"
            className="rounded border-slate-300"
            checked={selected.has(r.id)}
            onChange={() => toggleSelect(r.id)}
            aria-label="Select row"
          />
        ) : (
          <span className="text-slate-300">—</span>
        ),
    },
    {
      id: "tenant",
      header: "Tenant",
      cell: (r) => (
        <div>
          <div className="font-medium text-slate-900">{r.tenant.name ?? "—"}</div>
          <div className="text-xs text-slate-500">{r.tenant.phone}</div>
        </div>
      ),
    },
    {
      id: "unit",
      header: "Unit",
      cell: (r) => (
        <span className="text-sm text-slate-700">
          {r.bed.room.floor.name} · {r.bed.room.name} · {r.bed.label}
        </span>
      ),
    },
    {
      id: "amount",
      header: "Amount",
      cell: (r) => <span className="font-medium tabular-nums">{formatInr(r.amountMinor)}</span>,
    },
    {
      id: "due",
      header: "Due",
      cell: (r) => (
        <span className="text-sm text-slate-600">
          {new Date(r.dueDate).toLocaleDateString("en-IN")}
        </span>
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: (r) => (
        <span
          className={[
            "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
            r.status === "PAID"
              ? "bg-emerald-100 text-emerald-800"
              : r.status === "OVERDUE"
                ? "bg-rose-100 text-rose-800"
                : r.status === "WAIVED"
                  ? "bg-slate-100 text-slate-600"
                  : "bg-amber-100 text-amber-900",
          ].join(" ")}
        >
          {r.status}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: (r) => (
        <div className="flex flex-wrap justify-end gap-2">
          {r.status === "DUE" || r.status === "OVERDUE" ? (
            <Button
              type="button"
              className="px-3 py-1.5 text-xs"
              variant="secondary"
              onClick={() => setConfirmInvoice(r)}
            >
              Confirm
            </Button>
          ) : null}
          {r.status === "PAID" ? (
            <Button
              type="button"
              className="px-3 py-1.5 text-xs"
              variant="secondary"
              onClick={() => void openReceipt(r)}
            >
              Receipt
            </Button>
          ) : null}
        </div>
      ),
    },
  ];

  if (!orgId) {
    return (
      <OwnerShell title="Rent & collections">
        <p className="text-sm text-slate-600">Select an organization from your session.</p>
      </OwnerShell>
    );
  }

  return (
    <OwnerShell title="Rent & collections" contentMaxClassName="max-w-7xl">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Billing month</label>
            <div className="flex gap-2">
              <select
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>
                    {new Date(2000, m - 1).toLocaleString("en-IN", { month: "short" })}
                  </option>
                ))}
              </select>
              <Input
                type="number"
                className="w-28"
                value={year}
                min={2020}
                max={2100}
                onChange={(e) => setYear(Number(e.target.value))}
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Filter</label>
            <select
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All statuses</option>
              <option value="DUE">Due</option>
              <option value="OVERDUE">Overdue</option>
              <option value="PAID">Paid</option>
              <option value="WAIVED">Waived</option>
            </select>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            disabled={generateMutation.isPending}
            onClick={() => generateMutation.mutate()}
          >
            Generate month
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={exportMutation.isPending}
            onClick={() => exportMutation.mutate()}
          >
            Excel export
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="px-3 py-1.5 text-xs"
            disabled={eligibleRows.length === 0}
            onClick={() => toggleSelectAllOnPage()}
          >
            {allEligibleSelected ? "Clear selection" : "Select all due"}
          </Button>
          <Button
            type="button"
            disabled={selected.size === 0 || bulkMutation.isPending}
            onClick={() => bulkMutation.mutate([...selected])}
          >
            Bulk remind ({selected.size})
          </Button>
        </div>
      </div>

      {dash ? (
        <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            label="Collected"
            value={formatInr(dash.collectedMinor)}
            hint={`${Math.round(dash.collectionRate * 100)}% of billed`}
          />
          <KpiCard label="Outstanding" value={formatInr(dash.outstandingMinor)} hint="This month" />
          <KpiCard label="Overdue" value={String(dash.counts.overdue)} hint="Invoices" />
          <KpiCard label="Paid" value={String(dash.counts.paid)} hint={`of ${dash.counts.total}`} />
        </div>
      ) : null}

      <div className="mb-4 flex gap-2 border-b border-slate-200">
        <TabButton active={tab === "invoices"} onClick={() => setTab("invoices")}>
          Invoices
        </TabButton>
        <TabButton active={tab === "activity"} onClick={() => setTab("activity")}>
          Delivery log
        </TabButton>
      </div>

      {tab === "invoices" ? (
        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-slate-900">Reminder automation</h2>
            </div>
            {settingsQuery.data ? (
              <form
                className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
                onSubmit={settingsForm.handleSubmit((v) => patchSettingsMutation.mutate(v))}
              >
                <Field label="Due day (1–28)">
                  <Input
                    type="number"
                    min={1}
                    max={28}
                    {...settingsForm.register("dueDayOfMonth", { valueAsNumber: true })}
                  />
                </Field>
                <Field label="Remind days before due">
                  <Input
                    type="number"
                    min={0}
                    max={21}
                    {...settingsForm.register("remindDaysBefore", { valueAsNumber: true })}
                  />
                </Field>
                <Field label="Overdue repeat (days)">
                  <Input
                    type="number"
                    min={1}
                    max={30}
                    {...settingsForm.register("overdueRepeatDays", { valueAsNumber: true })}
                  />
                </Field>
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input type="checkbox" {...settingsForm.register("whatsappEnabled")} />
                  WhatsApp
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input type="checkbox" {...settingsForm.register("smsFallbackEnabled")} />
                  SMS fallback
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input type="checkbox" {...settingsForm.register("ownerOverdueDigestEnabled")} />
                  Owner overdue digest
                </label>
                <div className="sm:col-span-2 lg:col-span-3">
                  <Button type="submit" disabled={patchSettingsMutation.isPending}>
                    Save reminder settings
                  </Button>
                </div>
              </form>
            ) : (
              <p className="text-sm text-slate-500">Loading settings…</p>
            )}
          </section>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <DataTable
              columns={columns}
              rows={invoicesQuery.data?.items ?? []}
              getRowId={(r) => r.id}
              isLoading={invoicesQuery.isLoading}
              emptyLabel="No invoices for this month. Generate from occupied beds."
            />
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-slate-900">Recent notification jobs</h2>
          <div className="space-y-4">
            {(notificationsQuery.data?.items ?? []).map((j) => (
              <div key={j.id} className="rounded-xl border border-slate-100 bg-slate-50/80 p-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium text-slate-900">{j.type}</span>
                  <span className="text-xs text-slate-500">
                    {new Date(j.createdAt).toLocaleString("en-IN")} · {j.status} · attempts{" "}
                    {j.attemptCount}/{j.maxAttempts}
                  </span>
                </div>
                {j.lastError ? (
                  <p className="mt-1 text-xs text-rose-700">{j.lastError}</p>
                ) : null}
                <ul className="mt-2 space-y-1 border-t border-slate-200/80 pt-2 text-xs text-slate-600">
                  {j.deliveries.map((d) => (
                    <li key={`${j.id}-${d.createdAt}-${d.channel}`}>
                      <span className={d.success ? "text-emerald-700" : "text-rose-700"}>
                        {d.success ? "✓" : "✗"}
                      </span>{" "}
                      {d.channel} → {d.toPhone}
                      {d.providerSid ? ` · ${d.providerSid}` : null}
                      {d.errorMessage ? ` — ${d.errorMessage}` : null}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            {!notificationsQuery.data?.items.length ? (
              <p className="text-sm text-slate-500">No jobs yet. Reminders enqueue from automations.</p>
            ) : null}
          </div>
        </div>
      )}

      {confirmInvoice ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-[1px]">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-slate-900">Confirm payment</h3>
            <p className="mt-1 text-sm text-slate-600">
              {confirmInvoice.tenant.name ?? "Tenant"} · {formatInr(confirmInvoice.amountMinor)}
            </p>
            <ConfirmPaymentForm
              onSubmit={async (values) => {
                await confirmRentPaymentApi(orgId, confirmInvoice.id, values);
                toast.success("Payment recorded");
                setConfirmInvoice(null);
                await queryClient.invalidateQueries({ queryKey: ["rent-invoices", orgId] });
                await queryClient.invalidateQueries({ queryKey: ["rent-dashboard", orgId] });
              }}
              onCancel={() => setConfirmInvoice(null)}
            />
          </div>
        </div>
      ) : null}
    </OwnerShell>
  );
}

function KpiCard(props: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4 shadow-sm">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{props.label}</div>
      <div className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">{props.value}</div>
      <div className="mt-1 text-xs text-slate-500">{props.hint}</div>
    </div>
  );
}

function TabButton(props: {
  children: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      className={[
        "-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors",
        props.active
          ? "border-slate-900 text-slate-900"
          : "border-transparent text-slate-500 hover:text-slate-800",
      ].join(" ")}
    >
      {props.children}
    </button>
  );
}

function Field(props: { label: string; children: ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-xs font-medium text-slate-500">{props.label}</span>
      {props.children}
    </label>
  );
}

function ConfirmPaymentForm(props: {
  onSubmit: (values: ConfirmForm) => Promise<void>;
  onCancel: () => void;
}) {
  const form = useForm<ConfirmForm>({
    resolver: zodResolver(confirmRentPaymentDto),
    defaultValues: { paymentMethod: "UPI", notes: "" },
  });
  return (
    <form
      className="mt-4 space-y-3"
      onSubmit={form.handleSubmit(async (v) => {
        await props.onSubmit(v);
      })}
    >
      <Input placeholder="Payment method" {...form.register("paymentMethod")} />
      <Input placeholder="Notes (optional)" {...form.register("notes")} />
      <div className="flex gap-2 pt-2">
        <Button type="button" variant="secondary" className="flex-1" onClick={props.onCancel}>
          Cancel
        </Button>
        <Button type="submit" className="flex-1">
          Mark paid
        </Button>
      </div>
    </form>
  );
}
