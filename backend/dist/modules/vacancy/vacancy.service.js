import { AppError, internal } from "../../common/httpErrors.js";
import { logger } from "../../services/logger.service.js";
import { floorMapService } from "../floor-map/floor-map.service.js";
function matchesVacancyRoomFilter(room, filter) {
    if (room.vacantBeds <= 0)
        return false;
    const anyMaint = room.beds.some((b) => b.maintenanceActive);
    switch (filter) {
        case "all":
            return true;
        case "fully_vacant":
            return room.occupancyStatus === "VACANT";
        case "partial":
            return room.occupancyStatus === "PARTIAL_VACANCY";
        case "ready":
            return (!anyMaint &&
                room.occupancyStatus !== "MAINTENANCE" &&
                (room.occupancyStatus === "VACANT" || room.occupancyStatus === "PARTIAL_VACANCY"));
        default:
            return true;
    }
}
export class VacancyService {
    async summary(organizationId) {
        try {
            const { floors, meta } = await floorMapService.getOperationalFloors(organizationId);
            let fullyVacantRooms = 0;
            let partiallyVacantRooms = 0;
            let readyToMoveRooms = 0;
            let totalVacantBeds = 0;
            let totalBeds = 0;
            let vacancyLossMinor = 0;
            let oldestVacantMs = null;
            for (const f of floors) {
                for (const r of f.rooms) {
                    totalBeds += r.beds.length;
                    totalVacantBeds += r.vacantBeds;
                    for (const b of r.beds) {
                        if (b.operationalTone === "VACANT") {
                            vacancyLossMinor += b.monthlyRentMinor;
                            const t = Date.parse(b.updatedAt);
                            if (!Number.isNaN(t)) {
                                oldestVacantMs = oldestVacantMs == null ? t : Math.min(oldestVacantMs, t);
                            }
                        }
                    }
                    switch (r.occupancyStatus) {
                        case "VACANT":
                            fullyVacantRooms += 1;
                            break;
                        case "PARTIAL_VACANCY":
                            partiallyVacantRooms += 1;
                            break;
                        default:
                            break;
                    }
                    const anyMaint = r.beds.some((b) => b.maintenanceActive);
                    if (!anyMaint &&
                        r.occupancyStatus !== "MAINTENANCE" &&
                        (r.occupancyStatus === "VACANT" || r.occupancyStatus === "PARTIAL_VACANCY")) {
                        readyToMoveRooms += 1;
                    }
                }
            }
            const daysVacantApprox = oldestVacantMs != null
                ? Math.max(0, Math.floor((Date.now() - oldestVacantMs) / 86_400_000))
                : null;
            return {
                fullyVacantRooms,
                partiallyVacantRooms,
                readyToMoveRooms,
                totalVacantBeds,
                totalBeds,
                occupancyRate: totalBeds ? (totalBeds - totalVacantBeds) / totalBeds : 0,
                vacancyLossMinor,
                daysVacantApprox,
                meta,
            };
        }
        catch (e) {
            if (e instanceof AppError)
                throw e;
            logger.error({ message: "vacancy_summary_failed", organizationId, err: e });
            throw internal("Vacancy data sync failed. Please try again.");
        }
    }
    async rooms(organizationId, filter) {
        try {
            const { floors, meta } = await floorMapService.getOperationalFloors(organizationId);
            const rooms = [];
            for (const f of floors) {
                for (const r of f.rooms) {
                    if (!matchesVacancyRoomFilter(r, filter))
                        continue;
                    rooms.push({ floor: { id: f.id, name: f.name }, room: r });
                }
            }
            return { rooms, meta, filter };
        }
        catch (e) {
            if (e instanceof AppError)
                throw e;
            logger.error({ message: "vacancy_rooms_failed", organizationId, err: e });
            throw internal("Unable to load vacancy room list. Please try again.");
        }
    }
}
export const vacancyService = new VacancyService();
//# sourceMappingURL=vacancy.service.js.map