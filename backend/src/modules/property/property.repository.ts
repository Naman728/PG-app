import type { Prisma } from "@prisma/client";
import { prisma } from "../../prisma/client.js";

const bedTenantSelect = {
  id: true,
  name: true,
  phone: true,
  email: true,
} satisfies Prisma.UserSelect;

export class PropertyRepository {
  async assertFloorInOrg(floorId: string, organizationId: string) {
    return prisma.floor.findFirst({
      where: { id: floorId, organizationId, deletedAt: null },
    });
  }

  async assertRoomInOrg(roomId: string, organizationId: string) {
    return prisma.room.findFirst({
      where: {
        id: roomId,
        deletedAt: null,
        floor: { organizationId, deletedAt: null },
      },
    });
  }

  async assertBedInOrg(bedId: string, organizationId: string) {
    return prisma.bed.findFirst({
      where: {
        id: bedId,
        deletedAt: null,
        room: { deletedAt: null, floor: { organizationId, deletedAt: null } },
      },
    });
  }

  async listFloorsMap(organizationId: string) {
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

  async bedsForOrgStats(organizationId: string) {
    return prisma.bed.findMany({
      where: {
        deletedAt: null,
        room: { deletedAt: null, floor: { organizationId, deletedAt: null } },
      },
      select: { status: true, monthlyRentMinor: true },
    });
  }

  async listTenantMembers(organizationId: string) {
    return prisma.organizationMember.findMany({
      where: { organizationId, orgRole: "TENANT" },
      include: { user: { select: { id: true, name: true, phone: true } } },
      orderBy: { createdAt: "desc" },
    });
  }

  async assertTenantMember(organizationId: string, tenantUserId: string) {
    return prisma.organizationMember.findFirst({
      where: { organizationId, userId: tenantUserId, orgRole: "TENANT" },
    });
  }

  createFloor(data: Prisma.FloorCreateInput) {
    return prisma.floor.create({ data });
  }

  updateFloor(id: string, data: Prisma.FloorUpdateInput) {
    return prisma.floor.update({ where: { id }, data });
  }

  softDeleteFloor(id: string) {
    return prisma.floor.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  createRoom(data: Prisma.RoomCreateInput) {
    return prisma.room.create({ data });
  }

  updateRoom(id: string, data: Prisma.RoomUpdateInput) {
    return prisma.room.update({ where: { id }, data });
  }

  softDeleteRoom(id: string) {
    return prisma.room.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  createBed(data: Prisma.BedCreateInput) {
    return prisma.bed.create({ data });
  }

  updateBed(id: string, data: Prisma.BedUpdateInput) {
    return prisma.bed.update({ where: { id }, data });
  }

  softDeleteBed(id: string) {
    return prisma.bed.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
