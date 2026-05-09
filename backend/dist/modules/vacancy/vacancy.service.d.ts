export type VacancyRoomFilter = "all" | "fully_vacant" | "partial" | "ready";
export declare class VacancyService {
    summary(organizationId: string): Promise<{
        fullyVacantRooms: number;
        partiallyVacantRooms: number;
        readyToMoveRooms: number;
        totalVacantBeds: number;
        totalBeds: number;
        occupancyRate: number;
        vacancyLossMinor: number;
        daysVacantApprox: number | null;
        meta: {
            generatedAt: string;
        };
    }>;
    rooms(organizationId: string, filter: VacancyRoomFilter): Promise<{
        rooms: {
            floor: {
                id: string;
                name: string;
            };
            room: {
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
                    status: import("@prisma/client").BedStatus;
                    storageStatus: import("@prisma/client").BedStatus;
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
            };
        }[];
        meta: {
            generatedAt: string;
        };
        filter: VacancyRoomFilter;
    }>;
}
export declare const vacancyService: VacancyService;
