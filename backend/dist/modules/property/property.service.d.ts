import { BedStatus } from "@prisma/client";
import type { AssignBedInput, BulkPropertySetupInput, CreateBedInput, CreateFloorInput, CreateRoomInput, MarkBedPaidInput, UpdateBedInput, UpdateFloorInput, UpdateRoomLayoutInput } from "@pg-manager/shared";
import { PropertyRepository } from "./property.repository.js";
export declare class PropertyService {
    private readonly repo;
    constructor(repo?: PropertyRepository);
    /** Delegates to floor-map module (single operational source of truth). */
    getMap(organizationId: string): Promise<{
        id: string;
        name: string;
        sortOrder: number;
        gridColumns: number;
        rooms: {
            id: string;
            name: string;
            sharingLabel: string | null;
            colStart: number;
            colSpan: number;
            rowStart: number;
            rowSpan: number;
            sortOrder: number;
            occupancyStatus: import("../occupancy/occupancy.types.js").RoomOccupancyStatus;
            vacantBeds: number;
            occupiedBeds: number;
            maintenanceBeds: number;
            aggregateStatus: import("@prisma/client").$Enums.BedStatus;
            beds: {
                id: string;
                label: string;
                status: BedStatus;
                storageStatus: BedStatus;
                operationalTone: import("../occupancy/occupancy.types.js").BedOperationalTone;
                rentDisplayStatus: import("../occupancy/occupancy.types.js").RentDisplayStatus;
                maintenanceActive: boolean;
                openMaintenanceCount: number;
                monthlyRentMinor: number;
                tenant: {
                    id: string;
                    name: string | null;
                    phone: string | null;
                    email: string | null;
                } | null;
                paidThrough: string | null;
                maintenanceNote: string | null;
                assignedAt: string | null;
                updatedAt: string;
            }[];
        }[];
    }[]>;
    /**
     * One-shot guided setup: creates a floor (if none), then rooms + beds from sharing counts.
     * Only allowed when the org has no active rooms yet (safe for first-time owners).
     */
    bulkSetup(organizationId: string, input: BulkPropertySetupInput): Promise<{
        roomsCreated: number;
        bedsCreated: number;
        floors: {
            id: string;
            name: string;
            sortOrder: number;
            gridColumns: number;
            rooms: {
                id: string;
                name: string;
                sharingLabel: string | null;
                colStart: number;
                colSpan: number;
                rowStart: number;
                rowSpan: number;
                sortOrder: number;
                occupancyStatus: import("../occupancy/occupancy.types.js").RoomOccupancyStatus;
                vacantBeds: number;
                occupiedBeds: number;
                maintenanceBeds: number;
                aggregateStatus: import("@prisma/client").$Enums.BedStatus;
                beds: {
                    id: string;
                    label: string;
                    status: BedStatus;
                    storageStatus: BedStatus;
                    operationalTone: import("../occupancy/occupancy.types.js").BedOperationalTone;
                    rentDisplayStatus: import("../occupancy/occupancy.types.js").RentDisplayStatus;
                    maintenanceActive: boolean;
                    openMaintenanceCount: number;
                    monthlyRentMinor: number;
                    tenant: {
                        id: string;
                        name: string | null;
                        phone: string | null;
                        email: string | null;
                    } | null;
                    paidThrough: string | null;
                    maintenanceNote: string | null;
                    assignedAt: string | null;
                    updatedAt: string;
                }[];
            }[];
        }[];
    }>;
    getStats(organizationId: string): Promise<{
        counts: Record<import("@prisma/client").$Enums.BedStatus, number>;
        totalBeds: number;
        occupancyRate: number;
        monthlyCollectedMinor: number;
        monthlyAtRiskMinor: number;
        monthlyPotentialMinor: number;
    }>;
    listTenantMembers(organizationId: string): Promise<{
        membershipId: string;
        user: {
            name: string | null;
            id: string;
            phone: string | null;
        };
    }[]>;
    createFloor(organizationId: string, input: CreateFloorInput): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        organizationId: string;
        sortOrder: number;
        gridColumns: number;
    }>;
    updateFloor(organizationId: string, floorId: string, input: UpdateFloorInput): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        organizationId: string;
        sortOrder: number;
        gridColumns: number;
    }>;
    deleteFloor(organizationId: string, floorId: string): Promise<void>;
    createRoom(organizationId: string, floorId: string, input: CreateRoomInput): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        sortOrder: number;
        floorId: string;
        sharingLabel: string | null;
        colStart: number;
        colSpan: number;
        rowStart: number;
        rowSpan: number;
    }>;
    updateRoom(organizationId: string, roomId: string, input: UpdateRoomLayoutInput): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        sortOrder: number;
        floorId: string;
        sharingLabel: string | null;
        colStart: number;
        colSpan: number;
        rowStart: number;
        rowSpan: number;
    }>;
    deleteRoom(organizationId: string, roomId: string): Promise<void>;
    createBed(organizationId: string, roomId: string, input: CreateBedInput): Promise<{
        status: import("@prisma/client").$Enums.BedStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        tenantUserId: string | null;
        roomId: string;
        label: string;
        monthlyRentMinor: number;
        paidThrough: Date | null;
        maintenanceNote: string | null;
        assignedAt: Date | null;
    }>;
    updateBed(organizationId: string, bedId: string, input: UpdateBedInput): Promise<{
        status: import("@prisma/client").$Enums.BedStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        tenantUserId: string | null;
        roomId: string;
        label: string;
        monthlyRentMinor: number;
        paidThrough: Date | null;
        maintenanceNote: string | null;
        assignedAt: Date | null;
    }>;
    deleteBed(organizationId: string, bedId: string): Promise<{
        status: import("@prisma/client").$Enums.BedStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        tenantUserId: string | null;
        roomId: string;
        label: string;
        monthlyRentMinor: number;
        paidThrough: Date | null;
        maintenanceNote: string | null;
        assignedAt: Date | null;
    }>;
    assignBed(organizationId: string, bedId: string, input: AssignBedInput): Promise<{
        status: import("@prisma/client").$Enums.BedStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        tenantUserId: string | null;
        roomId: string;
        label: string;
        monthlyRentMinor: number;
        paidThrough: Date | null;
        maintenanceNote: string | null;
        assignedAt: Date | null;
    }>;
    vacateBed(organizationId: string, bedId: string): Promise<{
        status: import("@prisma/client").$Enums.BedStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        tenantUserId: string | null;
        roomId: string;
        label: string;
        monthlyRentMinor: number;
        paidThrough: Date | null;
        maintenanceNote: string | null;
        assignedAt: Date | null;
    }>;
    markBedPaid(organizationId: string, bedId: string, input: MarkBedPaidInput): Promise<{
        status: import("@prisma/client").$Enums.BedStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        tenantUserId: string | null;
        roomId: string;
        label: string;
        monthlyRentMinor: number;
        paidThrough: Date | null;
        maintenanceNote: string | null;
        assignedAt: Date | null;
    }>;
}
