import type { PropertyMapBed, PropertyMapFloor, PropertyMapRoom } from "../types/property";

export type SavedRoomRow = {
  floorId: string;
  floorName: string;
  room: PropertyMapRoom;
};

export function flattenRoomsByFloor(floors: PropertyMapFloor[]): SavedRoomRow[] {
  const out: SavedRoomRow[] = [];
  for (const f of floors) {
    for (const room of f.rooms) {
      out.push({ floorId: f.id, floorName: f.name, room });
    }
  }
  out.sort((a, b) => {
    const fa = a.floorName.localeCompare(b.floorName);
    if (fa !== 0) return fa;
    return a.room.name.localeCompare(b.room.name, undefined, { numeric: true });
  });
  return out;
}

export function formatRupees(minor: number): string {
  const r = minor / 100;
  return `₹${r.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

/** Human sharing label from room metadata or bed count. */
export function sharingTypeLabel(room: PropertyMapRoom): string {
  if (room.sharingLabel?.trim()) return room.sharingLabel.trim();
  const n = room.beds.length;
  if (n <= 1) return "Single";
  return `${n} sharing`;
}

/** Typical rent per “space” (first bed’s rent if all match, else average). */
export function rentPerSpaceMinor(room: PropertyMapRoom): number {
  if (!room.beds.length) return 0;
  const first = room.beds[0]!.monthlyRentMinor;
  const allSame = room.beds.every((b) => b.monthlyRentMinor === first);
  if (allSame) return first;
  const sum = room.beds.reduce((s, b) => s + b.monthlyRentMinor, 0);
  return Math.round(sum / room.beds.length);
}

export function totalRoomRentMinor(room: PropertyMapRoom): number {
  return room.beds.reduce((s, b) => s + b.monthlyRentMinor, 0);
}

export function humanRoomStatus(room: PropertyMapRoom): string {
  const beds = room.beds;
  if (!beds.length) return "—";
  if (beds.some((b) => b.status === "UNDER_MAINTENANCE")) return "Under repair";
  const vac = beds.filter((b) => b.status === "VACANT").length;
  if (vac === beds.length) return "Vacant";
  if (vac === 0) return "Full";
  return "Partly filled";
}

export function vacantBedCount(room: PropertyMapRoom): number {
  if (typeof room.vacantBeds === "number") return room.vacantBeds;
  return room.beds.filter((b) => b.status === "VACANT").length;
}

export function readyForMoveIn(room: PropertyMapRoom): boolean {
  const vac = vacantBedCount(room);
  if (vac <= 0) return false;
  if (room.occupancyStatus === "MAINTENANCE") return false;
  if (room.beds.some((b) => b.maintenanceActive)) return false;
  return !room.beds.some((b) => b.status === "UNDER_MAINTENANCE");
}

/** Rough days since last update for a vacant slot (proxy until we track vacated-at). */
export function daysSinceVacantHint(bed: PropertyMapBed): number | null {
  const vacant = bed.operationalTone === "VACANT" || bed.status === "VACANT";
  if (!vacant || !bed.updatedAt) return null;
  const t = new Date(bed.updatedAt).getTime();
  if (Number.isNaN(t)) return null;
  return Math.max(0, Math.floor((Date.now() - t) / 86_400_000));
}

export function amenitiesHint(room: PropertyMapRoom): string {
  const s = room.sharingLabel?.toLowerCase() ?? "";
  if (s.includes("ac")) return "AC (from note)";
  return "—";
}

export type VacancyFilter =
  | "all"
  | "fully_vacant"
  | "partial"
  | "ready"
  | "overdue"
  | "maintenance";

function hasMaintenanceSignal(room: PropertyMapRoom): boolean {
  if (room.occupancyStatus === "MAINTENANCE") return true;
  return room.beds.some((b) => b.status === "UNDER_MAINTENANCE" || b.maintenanceActive);
}

/** Occupied bed with server/client-visible overdue rent signal (not a duplicate of Prisma rules). */
function hasOverdueOccupiedBed(room: PropertyMapRoom): boolean {
  for (const b of room.beds) {
    if (b.status === "VACANT" || b.status === "UNDER_MAINTENANCE") continue;
    if (b.operationalTone === "OVERDUE" || b.rentDisplayStatus === "OVERDUE") return true;
  }
  return false;
}

export function roomMatchesVacancyFilter(room: PropertyMapRoom, f: VacancyFilter): boolean {
  const vac = vacantBedCount(room);
  if (vac === 0) return false;
  if (f === "all") return true;
  if (f === "overdue") {
    if (room.occupancyStatus === "OVERDUE") return true;
    return hasOverdueOccupiedBed(room);
  }
  if (f === "maintenance") {
    return hasMaintenanceSignal(room);
  }
  if (room.occupancyStatus) {
    if (f === "fully_vacant") return room.occupancyStatus === "VACANT";
    if (f === "partial") return room.occupancyStatus === "PARTIAL_VACANCY";
    if (f === "ready") return readyForMoveIn(room);
    return true;
  }
  if (f === "fully_vacant") return vac === room.beds.length;
  if (f === "partial") return vac > 0 && vac < room.beds.length;
  if (f === "ready") return readyForMoveIn(room);
  return true;
}

/** Vacancy card: partial occupancy with overdue rent on at least one filled bed. */
export function vacancyRoomHasOverdueOccupied(room: PropertyMapRoom): boolean {
  if (vacantBedCount(room) <= 0) return false;
  if (room.occupancyStatus === "OVERDUE") return true;
  return hasOverdueOccupiedBed(room);
}

export function vacancyRoomHasMaintenanceContext(room: PropertyMapRoom): boolean {
  return hasMaintenanceSignal(room);
}
