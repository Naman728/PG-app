import { BedStatus, MaintenanceTicketStatus, RentInvoiceStatus } from "@prisma/client";
import type { BedOperationalTone, RentDisplayStatus, RoomOccupancyStatus } from "./occupancy.types.js";

export type EngineBedInput = {
  id: string;
  label: string;
  status: BedStatus;
  monthlyRentMinor: number;
  tenantUserId: string | null;
  paidThrough: Date | null;
  maintenanceNote: string | null;
  maintenanceTickets: Array<{ status: MaintenanceTicketStatus }>;
  rentInvoices: Array<{ status: RentInvoiceStatus; dueDate: Date }>;
};

export function toEngineBedInput(b: {
  id: string;
  label: string;
  status: BedStatus;
  monthlyRentMinor: number;
  tenantUserId: string | null;
  paidThrough: Date | null;
  maintenanceNote: string | null;
  rentInvoices: Array<{ status: RentInvoiceStatus; dueDate: Date }>;
  maintenanceTickets: Array<{ status: MaintenanceTicketStatus }>;
}): EngineBedInput {
  return {
    id: b.id,
    label: b.label,
    status: b.status,
    monthlyRentMinor: b.monthlyRentMinor,
    tenantUserId: b.tenantUserId,
    paidThrough: b.paidThrough,
    maintenanceNote: b.maintenanceNote,
    maintenanceTickets: b.maintenanceTickets,
    rentInvoices: b.rentInvoices.map((i) => ({ status: i.status, dueDate: i.dueDate })),
  };
}

const ACTIVE_MAINTENANCE: MaintenanceTicketStatus[] = [
  MaintenanceTicketStatus.OPEN,
  MaintenanceTicketStatus.ACKNOWLEDGED,
  MaintenanceTicketStatus.IN_PROGRESS,
  MaintenanceTicketStatus.BLOCKED,
];

export function startOfLocalDay(now: Date): Date {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function maintenanceActiveForBed(b: EngineBedInput): boolean {
  if (b.status === BedStatus.UNDER_MAINTENANCE) return true;
  if (b.maintenanceNote?.trim()) return true;
  return b.maintenanceTickets.some((t) => ACTIVE_MAINTENANCE.includes(t.status));
}

export function computeRentDisplayStatus(b: EngineBedInput, now: Date): RentDisplayStatus {
  if (b.status === BedStatus.VACANT || !b.tenantUserId) return "NONE";
  const sod = startOfLocalDay(now).getTime();

  const actionable = b.rentInvoices.filter(
    (inv) => inv.status === RentInvoiceStatus.DUE || inv.status === RentInvoiceStatus.OVERDUE,
  );
  for (const inv of actionable) {
    if (inv.status === RentInvoiceStatus.OVERDUE) return "OVERDUE";
    const due = inv.dueDate.getTime();
    if (inv.status === RentInvoiceStatus.DUE && due < sod) return "OVERDUE";
  }
  const pendingDue = actionable.find((inv) => inv.status === RentInvoiceStatus.DUE);
  if (pendingDue) return "PENDING";

  if (b.status === BedStatus.OCCUPIED_UNPAID) {
    if (!b.paidThrough) return "OVERDUE";
    if (b.paidThrough.getTime() < sod) return "OVERDUE";
    return "PENDING";
  }
  return "CURRENT";
}

export function computeBedOperationalTone(b: EngineBedInput, now: Date): BedOperationalTone {
  if (maintenanceActiveForBed(b)) return "MAINTENANCE";
  if (b.status === BedStatus.VACANT || !b.tenantUserId) return "VACANT";
  const rent = computeRentDisplayStatus(b, now);
  if (rent === "OVERDUE") return "OVERDUE";
  if (rent === "PENDING") return "PENDING";
  return "PAID";
}

export function computeRoomOccupancyStatus(beds: EngineBedInput[], now: Date): RoomOccupancyStatus {
  if (!beds.length) return "VACANT";
  const tones = beds.map((b) => computeBedOperationalTone(b, now));
  if (tones.some((t) => t === "MAINTENANCE")) return "MAINTENANCE";
  const vac = tones.filter((t) => t === "VACANT").length;
  if (vac === beds.length) return "VACANT";
  if (vac > 0) return "PARTIAL_VACANCY";
  if (tones.some((t) => t === "OVERDUE")) return "OVERDUE";
  if (tones.some((t) => t === "PENDING")) return "PENDING";
  return "OCCUPIED_PAID";
}

/** Maps derived room status to legacy Prisma aggregate for filters / backwards compatibility. */
export function occupancyStatusToLegacyAggregate(s: RoomOccupancyStatus): BedStatus {
  switch (s) {
    case "MAINTENANCE":
      return BedStatus.UNDER_MAINTENANCE;
    case "VACANT":
      return BedStatus.VACANT;
    case "PARTIAL_VACANCY":
    case "PENDING":
    case "OVERDUE":
      return BedStatus.OCCUPIED_UNPAID;
    case "OCCUPIED_PAID":
      return BedStatus.OCCUPIED_PAID;
    default:
      return BedStatus.VACANT;
  }
}
