import type { PropertyStats } from "../../types/property";
import { BED_STATUS_LABEL } from "./bed-status-styles";
import type { BedStatus } from "../../types/property";

function formatMinor(minor: number) {
  const major = minor / 100;
  return `₹${major.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

const ORDER: BedStatus[] = [
  "OCCUPIED_PAID",
  "OCCUPIED_UNPAID",
  "VACANT",
  "UNDER_MAINTENANCE",
];

type Props = {
  stats: PropertyStats | undefined;
  isLoading: boolean;
};

export function PropertyStatsBanner({ stats, isLoading }: Props) {
  if (isLoading && !stats) {
    return (
      <div className="h-24 animate-pulse rounded-xl bg-slate-100 ring-1 ring-slate-200/80" />
    );
  }
  if (!stats) return null;

  const pct = Math.round(stats.occupancyRate * 100);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm ring-1 ring-black/5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Occupancy
          </p>
          <p className="text-3xl font-semibold text-slate-900">{pct}%</p>
          <p className="text-xs text-slate-600">
            {stats.totalBeds - stats.counts.VACANT} of {stats.totalBeds} beds not vacant
          </p>
        </div>
        <div className="flex flex-wrap gap-3 text-xs">
          {ORDER.map((k) => (
            <div key={k} className="rounded-lg bg-slate-50 px-2 py-1 ring-1 ring-slate-200/80">
              <span className="font-medium text-slate-700">{stats.counts[k]}</span>{" "}
              <span className="text-slate-500">{BED_STATUS_LABEL[k]}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-4 grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-3">
        <div>
          <p className="text-[10px] font-semibold uppercase text-emerald-700">Collected (est.)</p>
          <p className="text-lg font-semibold text-slate-900">
            {formatMinor(stats.monthlyCollectedMinor)}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase text-amber-700">At risk (unpaid)</p>
          <p className="text-lg font-semibold text-slate-900">
            {formatMinor(stats.monthlyAtRiskMinor)}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase text-slate-600">Potential (occupied)</p>
          <p className="text-lg font-semibold text-slate-900">
            {formatMinor(stats.monthlyPotentialMinor)}
          </p>
        </div>
      </div>
    </div>
  );
}
