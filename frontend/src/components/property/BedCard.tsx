import { Button } from "../ui/button";
import { Input } from "../ui/input";
import type { PropertyMapBed, PropertyTenantMember } from "../../types/property";
import { BED_STATUS_LABEL, bedStatusPillClass } from "./bed-status-styles";

function formatRent(minor: number) {
  const major = minor / 100;
  return `₹${major.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

type Props = {
  bed: PropertyMapBed;
  tenantOptions: PropertyTenantMember[];
  onAssign: (bedId: string, tenantUserId: string) => void;
  onVacate: (bedId: string) => void;
  onMarkPaid: (bedId: string, paidThroughIso: string) => void;
  onSetMaintenance: (bedId: string, note: string) => void;
  onClearMaintenance: (bedId: string) => void;
  busyBedId: string | null;
  canMutateBeds: boolean;
};

export function BedCard({
  bed,
  tenantOptions,
  onAssign,
  onVacate,
  onMarkPaid,
  onSetMaintenance,
  onClearMaintenance,
  busyBedId,
  canMutateBeds,
}: Props) {
  const busy = busyBedId === bed.id;
  const disabled = !canMutateBeds || busy;

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-semibold text-slate-900">{bed.label}</span>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${bedStatusPillClass(bed.status)}`}
        >
          {BED_STATUS_LABEL[bed.status]}
        </span>
        <span className="text-xs text-slate-600">{formatRent(bed.monthlyRentMinor)}/mo</span>
      </div>

      {bed.tenant ? (
        <p className="mt-2 text-xs text-slate-700">
          Tenant:{" "}
          <span className="font-medium">
            {bed.tenant.name ?? bed.tenant.email ?? bed.tenant.phone ?? "Tenant"}
          </span>
          {bed.paidThrough ? (
            <span className="block text-slate-500">
              Paid through {new Date(bed.paidThrough).toLocaleDateString()}
            </span>
          ) : null}
        </p>
      ) : (
        <p className="mt-2 text-xs text-slate-500">No tenant assigned</p>
      )}

      {bed.maintenanceNote ? (
        <p className="mt-2 rounded border border-violet-200 bg-violet-50 px-2 py-1 text-xs text-violet-900">
          {bed.maintenanceNote}
        </p>
      ) : null}

      <div className="mt-3 flex flex-col gap-2 border-t border-slate-200/80 pt-3">
        {bed.status === "VACANT" || bed.status === "OCCUPIED_UNPAID" ? (
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center">
            <select
              disabled={disabled || tenantOptions.length === 0}
              className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2 text-sm sm:max-w-[200px]"
              defaultValue=""
              onChange={(e) => {
                const v = e.target.value;
                if (v) onAssign(bed.id, v);
                e.target.value = "";
              }}
            >
              <option value="">
                {tenantOptions.length ? "Assign tenant…" : "No tenants in org"}
              </option>
              {tenantOptions.map((m) => (
                <option key={m.user.id} value={m.user.id}>
                  {m.user.name ?? m.user.phone}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        {bed.tenant && bed.status !== "UNDER_MAINTENANCE" ? (
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            {bed.status === "OCCUPIED_UNPAID" || bed.status === "OCCUPIED_PAID" ? (
              <form
                className="flex flex-1 flex-wrap items-end gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  const d = String(fd.get("paidDate") ?? "");
                  if (!d) return;
                  const iso = new Date(`${d}T12:00:00.000Z`).toISOString();
                  onMarkPaid(bed.id, iso);
                }}
              >
                <label className="flex min-w-[140px] flex-1 flex-col text-[10px] font-medium uppercase text-slate-500">
                  Rent paid through
                  <Input type="date" name="paidDate" required className="mt-0.5 h-9" />
                </label>
                <Button type="submit" className="h-9 shrink-0 px-3 py-1 text-xs" disabled={disabled}>
                  Update
                </Button>
              </form>
            ) : null}
            <Button
              type="button"
              variant="secondary"
              className="h-9 px-3 text-xs"
              disabled={disabled}
              onClick={() => onVacate(bed.id)}
            >
              Vacate
            </Button>
          </div>
        ) : null}

        {bed.status === "UNDER_MAINTENANCE" ? (
          <Button
            type="button"
            variant="secondary"
            className="h-9 px-3 text-xs"
            disabled={disabled}
            onClick={() => onClearMaintenance(bed.id)}
          >
            End maintenance → vacant
          </Button>
        ) : (
          <form
            className="flex flex-col gap-2 sm:flex-row sm:items-end"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const note = String(fd.get("maintNote") ?? "").trim();
              if (!note) return;
              onSetMaintenance(bed.id, note);
              e.currentTarget.reset();
            }}
          >
            <label className="flex min-w-0 flex-1 flex-col text-[10px] font-medium uppercase text-slate-500">
              Maintenance note
              <Input name="maintNote" required className="mt-0.5 h-9" placeholder="e.g. AC repair" />
            </label>
            <Button type="submit" variant="secondary" className="h-9 shrink-0 px-3 text-xs" disabled={disabled}>
              Set maintenance
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
