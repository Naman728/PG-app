import type { BedStatus } from "../../types/property";

export const BED_STATUS_LABEL: Record<BedStatus, string> = {
  OCCUPIED_PAID: "Occupied · paid",
  OCCUPIED_UNPAID: "Occupied · unpaid",
  VACANT: "Vacant",
  UNDER_MAINTENANCE: "Under maintenance",
};

/** Tile / map chrome: border + tint */
export function roomStatusChrome(status: BedStatus): string {
  switch (status) {
    case "OCCUPIED_PAID":
      return "border-emerald-500/80 bg-emerald-50/90 shadow-[inset_0_0_0_1px_rgba(16,185,129,0.15)]";
    case "OCCUPIED_UNPAID":
      return "border-amber-500/80 bg-amber-50/90 shadow-[inset_0_0_0_1px_rgba(245,158,11,0.2)]";
    case "VACANT":
      return "border-rose-400/90 bg-rose-50/90 shadow-[inset_0_0_0_1px_rgba(244,63,94,0.12)]";
    case "UNDER_MAINTENANCE":
      return "border-slate-400 bg-slate-100 shadow-[inset_0_0_0_1px_rgba(100,116,139,0.2)]";
    default:
      return "border-slate-200 bg-white";
  }
}

export function bedStatusPillClass(status: BedStatus): string {
  switch (status) {
    case "OCCUPIED_PAID":
      return "bg-emerald-600 text-white";
    case "OCCUPIED_UNPAID":
      return "bg-amber-600 text-white";
    case "VACANT":
      return "bg-slate-200 text-slate-800";
    case "UNDER_MAINTENANCE":
      return "bg-violet-600 text-white";
    default:
      return "bg-slate-200 text-slate-800";
  }
}

/** Small bed letter chip on floor map tiles (matches owner legend colors). */
export function bedChipClass(status: BedStatus): string {
  switch (status) {
    case "OCCUPIED_PAID":
      return "bg-emerald-500 text-white ring-1 ring-emerald-700/30";
    case "OCCUPIED_UNPAID":
      return "bg-amber-500 text-white ring-1 ring-amber-700/30";
    case "VACANT":
      return "bg-rose-500 text-white ring-1 ring-rose-700/25";
    case "UNDER_MAINTENANCE":
      return "bg-slate-400 text-white ring-1 ring-slate-600/25";
    default:
      return "bg-slate-300 text-slate-800";
  }
}

/** Short labels for filters and legends (non-technical). */
export const BED_STATUS_SHORT: Record<BedStatus, string> = {
  OCCUPIED_PAID: "Paid",
  OCCUPIED_UNPAID: "Rent due",
  VACANT: "Vacant",
  UNDER_MAINTENANCE: "Repair",
};
