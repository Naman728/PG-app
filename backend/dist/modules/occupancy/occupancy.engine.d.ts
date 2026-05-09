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
    maintenanceTickets: Array<{
        status: MaintenanceTicketStatus;
    }>;
    rentInvoices: Array<{
        status: RentInvoiceStatus;
        dueDate: Date;
    }>;
};
export declare function toEngineBedInput(b: {
    id: string;
    label: string;
    status: BedStatus;
    monthlyRentMinor: number;
    tenantUserId: string | null;
    paidThrough: Date | null;
    maintenanceNote: string | null;
    rentInvoices: Array<{
        status: RentInvoiceStatus;
        dueDate: Date;
    }>;
    maintenanceTickets: Array<{
        status: MaintenanceTicketStatus;
    }>;
}): EngineBedInput;
export declare function startOfLocalDay(now: Date): Date;
export declare function maintenanceActiveForBed(b: EngineBedInput): boolean;
export declare function computeRentDisplayStatus(b: EngineBedInput, now: Date): RentDisplayStatus;
export declare function computeBedOperationalTone(b: EngineBedInput, now: Date): BedOperationalTone;
export declare function computeRoomOccupancyStatus(beds: EngineBedInput[], now: Date): RoomOccupancyStatus;
/** Maps derived room status to legacy Prisma aggregate for filters / backwards compatibility. */
export declare function occupancyStatusToLegacyAggregate(s: RoomOccupancyStatus): BedStatus;
