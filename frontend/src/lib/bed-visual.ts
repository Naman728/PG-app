import type { PropertyMapBed, PropertyMapRoom } from "../types/property";
import { vacantBedCount } from "./room-display";

/** Display tier for map chips (reference UI: paid / pending / overdue / vacant / maintenance). */
export type BedVisualTone = "paid" | "pending" | "overdue" | "vacant" | "maintenance";

function startOfLocalDay(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function parsePaidThrough(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  return Number.isNaN(t) ? null : t;
}

/**
 * Prefer server `operationalTone` from `/floor-map`; otherwise derive locally (legacy).
 */
export function getBedVisualTone(bed: PropertyMapBed): BedVisualTone {
  if (bed.operationalTone) {
    switch (bed.operationalTone) {
      case "PAID":
        return "paid";
      case "PENDING":
        return "pending";
      case "OVERDUE":
        return "overdue";
      case "VACANT":
        return "vacant";
      case "MAINTENANCE":
        return "maintenance";
      default:
        break;
    }
  }
  if (bed.status === "UNDER_MAINTENANCE" || bed.maintenanceActive) return "maintenance";
  if (bed.status === "VACANT") return "vacant";
  if (bed.status === "OCCUPIED_PAID") return "paid";
  if (bed.status === "OCCUPIED_UNPAID") {
    const paid = parsePaidThrough(bed.paidThrough);
    if (paid == null) return "overdue";
    return paid < startOfLocalDay() ? "overdue" : "pending";
  }
  return "vacant";
}

/** Worst tone in the room for card chrome (maintenance > overdue > pending > vacant > paid). */
const toneRank: Record<BedVisualTone, number> = {
  maintenance: 5,
  overdue: 4,
  pending: 3,
  vacant: 2,
  paid: 1,
};

export function worstToneInRoom(room: PropertyMapRoom): BedVisualTone {
  if (!room.beds.length) return "vacant";
  let worst: BedVisualTone = "paid";
  let r = toneRank.paid;
  for (const b of room.beds) {
    const t = getBedVisualTone(b);
    if (toneRank[t] > r) {
      r = toneRank[t];
      worst = t;
    }
  }
  return worst;
}

export function occupiedBedCount(room: PropertyMapRoom): number {
  if (typeof room.occupiedBeds === "number") return room.occupiedBeds;
  return room.beds.filter((b) => b.status === "OCCUPIED_PAID" || b.status === "OCCUPIED_UNPAID").length;
}

export type MapVacancyFilter = "all" | "vacancies_only" | "fully_vacant" | "partial";

export function roomMatchesMapVacancyFilter(room: PropertyMapRoom, f: MapVacancyFilter): boolean {
  const vac = vacantBedCount(room);
  const total = room.beds.length;
  if (f === "all") return true;
  if (room.occupancyStatus) {
    if (f === "vacancies_only") return vac > 0;
    if (f === "fully_vacant") return room.occupancyStatus === "VACANT";
    if (f === "partial") return room.occupancyStatus === "PARTIAL_VACANCY";
    return true;
  }
  if (f === "vacancies_only") return vac > 0;
  if (f === "fully_vacant") return total > 0 && vac === total;
  if (f === "partial") return vac > 0 && vac < total;
  return true;
}
