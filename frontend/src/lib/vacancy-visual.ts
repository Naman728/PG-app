import type { PropertyMapRoom } from "../types/property";
import {
  readyForMoveIn,
  vacantBedCount,
  vacancyRoomHasMaintenanceContext,
  vacancyRoomHasOverdueOccupied,
} from "./room-display";

export type VacancyStripeKind = "vacant" | "partial" | "pending" | "overdue" | "maintenance";

export type VacancyPresentation = {
  stripe: VacancyStripeKind;
  headline: string;
  subline: string;
};

/**
 * Purely presentational rollup for vacancy cards (server fields first).
 */
export function getVacancyPresentation(room: PropertyMapRoom): VacancyPresentation {
  const vac = vacantBedCount(room);
  const total = room.beds.length;
  const fullEmpty = vac === total;

  if (vacancyRoomHasMaintenanceContext(room)) {
    return {
      stripe: "maintenance",
      headline: "Under maintenance",
      subline: fullEmpty ? "Repairs in progress" : "Some beds blocked · still has openings",
    };
  }
  if (vacancyRoomHasOverdueOccupied(room)) {
    return {
      stripe: "overdue",
      headline: "Overdue on rent",
      subline: fullEmpty ? "Resolve dues" : "Money leaking while beds sit free",
    };
  }
  if (room.occupancyStatus === "PENDING") {
    return {
      stripe: "pending",
      headline: "Pending payment",
      subline: fullEmpty ? "Awaiting dues" : "Watch unpaid beds",
    };
  }
  if (vac > 0 && vac < total) {
    return {
      stripe: "partial",
      headline: "Partially vacant",
      subline: `${vac} free · ${total - vac} filled`,
    };
  }
  if (readyForMoveIn(room)) {
    return {
      stripe: "vacant",
      headline: "Ready to show",
      subline: `${vac} bed${vac === 1 ? "" : "s"} free · walk-in friendly`,
    };
  }
  return {
    stripe: "vacant",
    headline: "Vacancy",
    subline: `${vac} bed${vac === 1 ? "" : "s"} free`,
  };
}

export function vacancyStripeClasses(kind: VacancyStripeKind): { bar: string; halo: string; chip: string } {
  switch (kind) {
    case "maintenance":
      return {
        bar: "bg-slate-500",
        halo: "ring-slate-400/35",
        chip: "bg-slate-100 text-slate-800 ring-slate-300",
      };
    case "overdue":
      return {
        bar: "bg-rose-700",
        halo: "ring-rose-500/40",
        chip: "bg-rose-50 text-rose-950 ring-rose-200",
      };
    case "pending":
      return {
        bar: "bg-amber-500",
        halo: "ring-amber-400/40",
        chip: "bg-amber-50 text-amber-950 ring-amber-200",
      };
    case "partial":
      return {
        bar: "bg-amber-400",
        halo: "ring-amber-300/35",
        chip: "bg-amber-50/90 text-amber-950 ring-amber-200",
      };
    case "vacant":
    default:
      return {
        bar: "bg-red-600",
        halo: "ring-red-500/40",
        chip: "bg-red-50 text-red-950 ring-red-200",
      };
  }
}
