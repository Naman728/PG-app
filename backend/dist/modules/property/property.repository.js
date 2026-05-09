import { prisma } from "../../prisma/client.js";
const bedTenantSelect = {
    id: true,
    name: true,
    phone: true,
    email: true,
};
export class PropertyRepository {
    async assertFloorInOrg(floorId, organizationId) {
        return prisma.floor.findFirst({
            where: { id: floorId, organizationId, deletedAt: null },
        });
    }
    async assertRoomInOrg(roomId, organizationId) {
        return prisma.room.findFirst({
            where: {
                id: roomId,
                deletedAt: null,
                floor: { organizationId, deletedAt: null },
            },
        });
    }
    async assertBedInOrg(bedId, organizationId) {
        return prisma.bed.findFirst({
            where: {
                id: bedId,
                deletedAt: null,
                room: { deletedAt: null, floor: { organizationId, deletedAt: null } },
            },
        });
    }
    async listFloorsMap(organizationId) {
        return prisma.floor.findMany({
            where: { organizationId, deletedAt: null },
            orderBy: { sortOrder: "asc" },
            include: {
                rooms: {
                    where: { deletedAt: null },
                    orderBy: { sortOrder: "asc" },
                    include: {
                        beds: {
                            where: { deletedAt: null },
                            orderBy: { label: "asc" },
                            include: { tenant: { select: bedTenantSelect } },
                        },
                    },
                },
            },
        });
    }
    async bedsForOrgStats(organizationId) {
        return prisma.bed.findMany({
            where: {
                deletedAt: null,
                room: { deletedAt: null, floor: { organizationId, deletedAt: null } },
            },
            select: { status: true, monthlyRentMinor: true },
        });
    }
    async listTenantMembers(organizationId) {
        return prisma.organizationMember.findMany({
            where: { organizationId, orgRole: "TENANT" },
            include: { user: { select: { id: true, name: true, phone: true } } },
            orderBy: { createdAt: "desc" },
        });
    }
    async assertTenantMember(organizationId, tenantUserId) {
        return prisma.organizationMember.findFirst({
            where: { organizationId, userId: tenantUserId, orgRole: "TENANT" },
        });
    }
    createFloor(data) {
        return prisma.floor.create({ data });
    }
    updateFloor(id, data) {
        return prisma.floor.update({ where: { id }, data });
    }
    softDeleteFloor(id) {
        return prisma.floor.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
    }
    createRoom(data) {
        return prisma.room.create({ data });
    }
    updateRoom(id, data) {
        return prisma.room.update({ where: { id }, data });
    }
    softDeleteRoom(id) {
        return prisma.room.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
    }
    createBed(data) {
        return prisma.bed.create({ data });
    }
    updateBed(id, data) {
        return prisma.bed.update({ where: { id }, data });
    }
    softDeleteBed(id) {
        return prisma.bed.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
    }
}
//# sourceMappingURL=property.repository.js.map