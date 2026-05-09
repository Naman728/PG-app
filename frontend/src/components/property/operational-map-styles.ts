import type { BedVisualTone } from "../../lib/bed-visual";

/** Bed letter chip — reference palette. */
export function operationalBedChipClass(tone: BedVisualTone): string {
  switch (tone) {
    case "paid":
      return "bg-emerald-500 text-white shadow-inner ring-1 ring-emerald-800/25";
    case "pending":
      return "bg-amber-400 text-amber-950 shadow-inner ring-1 ring-amber-800/30";
    case "overdue":
      return "bg-red-900 text-white shadow-inner ring-1 ring-black/30";
    case "vacant":
      return "bg-red-500 text-white shadow-inner ring-1 ring-red-900/35";
    case "maintenance":
      return "bg-slate-400 text-slate-900 shadow-inner ring-1 ring-slate-700/35";
  }
}

/** Room card border / emphasis from dominant operational state. */
export function operationalRoomFrameClass(worst: BedVisualTone, hasVacancy: boolean, dimmed: boolean): string {
  const dim = dimmed ? "opacity-[0.32] saturate-[0.6] grayscale-[0.15]" : "";
  if (hasVacancy) {
    return [
      "border-red-500/90 bg-gradient-to-b from-red-50/90 to-white shadow-[0_0_0_1px_rgba(239,68,68,0.2)]",
      dim,
    ].join(" ");
  }
  switch (worst) {
    case "maintenance":
      return ["border-slate-400 bg-slate-50/80", dim].join(" ");
    case "overdue":
      return ["border-red-900/70 bg-red-50/40", dim].join(" ");
    case "pending":
      return ["border-amber-400/90 bg-amber-50/50", dim].join(" ");
    case "paid":
      return ["border-emerald-300/90 bg-emerald-50/35", dim].join(" ");
    default:
      return ["border-slate-200 bg-white", dim].join(" ");
  }
}

export const OPERATIONAL_LEGEND = [
  { tone: "paid" as const, label: "Occupied · paid" },
  { tone: "pending" as const, label: "Occupied · rent pending" },
  { tone: "overdue" as const, label: "Occupied · overdue" },
  { tone: "vacant" as const, label: "Vacant" },
  { tone: "maintenance" as const, label: "Maintenance" },
] as const;
