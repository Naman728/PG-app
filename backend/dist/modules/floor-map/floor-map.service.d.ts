import { BedStatus } from "@prisma/client";
import type { BedOperationalTone, RentDisplayStatus, RoomOccupancyStatus } from "../occupancy/occupancy.types.js";
import { FloorMapRepository } from "./floor-map.repository.js";
export declare class FloorMapService {
    private readonly repo;
    constructor(repo?: FloorMapRepository);
    getOperationalFloors(organizationId: string): Promise<{
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
                occupancyStatus: RoomOccupancyStatus;
                vacantBeds: number;
                occupiedBeds: number;
                maintenanceBeds: number;
                aggregateStatus: import("@prisma/client").$Enums.BedStatus;
                beds: {
                    id: string;
                    label: string;
                    status: BedStatus;
                    storageStatus: BedStatus;
                    operationalTone: BedOperationalTone;
                    rentDisplayStatus: RentDisplayStatus;
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
        meta: {
            generatedAt: string;
        };
    }>;
    getRoomDetails(organizationId: string, roomId: string): Promise<{
        room: {
            id: string;
            name: string;
            sharingLabel: string | null;
            colStart: number;
            colSpan: number;
            rowStart: number;
            rowSpan: number;
            sortOrder: number;
            occupancyStatus: RoomOccupancyStatus;
            vacantBeds: number;
            occupiedBeds: number;
            maintenanceBeds: number;
            aggregateStatus: import("@prisma/client").$Enums.BedStatus;
            beds: {
                id: string;
                label: string;
                status: BedStatus;
                storageStatus: BedStatus;
                operationalTone: BedOperationalTone;
                rentDisplayStatus: RentDisplayStatus;
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
        };
        floor: {
            id: string;
            name: string;
        };
    }>;
    private mapFloor;
    private mapRoom;
    private mapBed;
}
export declare const floorMapService: FloorMapService;
