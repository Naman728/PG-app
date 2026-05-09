import { AppError, internal, notFound } from "../../common/httpErrors.js";
import { logger } from "../../services/logger.service.js";
import { computeBedOperationalTone, computeRentDisplayStatus, computeRoomOccupancyStatus, maintenanceActiveForBed, occupancyStatusToLegacyAggregate, toEngineBedInput, } from "../occupancy/occupancy.engine.js";
import { FloorMapRepository } from "./floor-map.repository.js";
function toIsoStringOrNull(value) {
    if (value == null)
        return null;
    if (value instanceof Date && !Number.isNaN(value.getTime()))
        return value.toISOString();
    if (typeof value === "string" && value.length > 0) {
        const ms = Date.parse(value);
        if (!Number.isNaN(ms))
            return new Date(ms).toISOString();
    }
    return null;
}
function bedUpdatedAtIso(bed) {
    return (toIsoStringOrNull(bed.updatedAt) ??
        toIsoStringOrNull(bed.createdAt) ??
        new Date().toISOString());
}
export class FloorMapService {
    repo;
    constructor(repo = new FloorMapRepository()) {
        this.repo = repo;
    }
    async getOperationalFloors(organizationId) {
        const org = await this.repo.assertOrganizationExists(organizationId);
        if (!org)
            throw notFound("Organization not found");
        try {
            const floors = await this.repo.loadPropertyGraph(organizationId);
            const now = new Date();
            return {
                floors: floors.map((f) => this.mapFloor(f, now)),
                meta: { generatedAt: now.toISOString() },
            };
        }
        catch (e) {
            if (e instanceof AppError)
                throw e;
            logger.error({ message: "floor_map_load_failed", organizationId, err: e });
            const hint = process.env.NODE_ENV === "development" && e instanceof Error ? `: ${e.message}` : ". Please try again.";
            throw internal(`Unable to load floor occupancy${hint}`);
        }
    }
    async getRoomDetails(organizationId, roomId) {
        const org = await this.repo.assertOrganizationExists(organizationId);
        if (!org)
            throw notFound("Organization not found");
        const row = await this.repo.loadRoomWithBeds(organizationId, roomId);
        if (!row)
            throw notFound("Room not found");
        const now = new Date();
        try {
            const { floor, ...roomCore } = row;
            return {
                room: this.mapRoom(roomCore, now),
                floor: { id: floor.id, name: floor.name },
            };
        }
        catch (e) {
            if (e instanceof AppError)
                throw e;
            logger.error({ message: "room_details_failed", organizationId, roomId, err: e });
            const hint = process.env.NODE_ENV === "development" && e instanceof Error ? `: ${e.message}` : ". Please try again.";
            throw internal(`Unable to load room details${hint}`);
        }
    }
    mapFloor(floor, now) {
        return {
            id: floor.id,
            name: floor.name,
            sortOrder: floor.sortOrder,
            gridColumns: floor.gridColumns,
            rooms: floor.rooms.map((r) => this.mapRoom(r, now)),
        };
    }
    mapRoom(room, now) {
        const engineBeds = room.beds.map(toEngineBedInput);
        const occupancyStatus = computeRoomOccupancyStatus(engineBeds, now);
        const legacyAggregate = occupancyStatusToLegacyAggregate(occupancyStatus);
        let vacantBeds = 0;
        let occupiedBeds = 0;
        let maintenanceBeds = 0;
        for (const eb of engineBeds) {
            const tone = computeBedOperationalTone(eb, now);
            if (tone === "VACANT")
                vacantBeds += 1;
            else if (tone === "MAINTENANCE")
                maintenanceBeds += 1;
            else
                occupiedBeds += 1;
        }
        return {
            id: room.id,
            name: room.name,
            sharingLabel: room.sharingLabel,
            colStart: room.colStart,
            colSpan: room.colSpan,
            rowStart: room.rowStart,
            rowSpan: room.rowSpan,
            sortOrder: room.sortOrder,
            occupancyStatus,
            vacantBeds,
            occupiedBeds,
            maintenanceBeds,
            aggregateStatus: legacyAggregate,
            beds: room.beds.map((b) => this.mapBed(b, now)),
        };
    }
    mapBed(b, now) {
        const engine = toEngineBedInput(b);
        const operationalTone = computeBedOperationalTone(engine, now);
        const rentDisplayStatus = computeRentDisplayStatus(engine, now);
        const maintenanceActive = maintenanceActiveForBed(engine);
        return {
            id: b.id,
            label: b.label,
            status: b.status,
            storageStatus: b.status,
            operationalTone,
            rentDisplayStatus,
            maintenanceActive,
            openMaintenanceCount: b.maintenanceTickets.length,
            monthlyRentMinor: b.monthlyRentMinor,
            tenant: b.tenant,
            paidThrough: toIsoStringOrNull(b.paidThrough),
            maintenanceNote: b.maintenanceNote,
            assignedAt: toIsoStringOrNull(b.assignedAt),
            updatedAt: bedUpdatedAtIso(b),
        };
    }
}
export const floorMapService = new FloorMapService();
//# sourceMappingURL=floor-map.service.js.map