import { BedStatus, type Prisma } from "@prisma/client";
import type {
  AssignBedInput,
  BulkPropertySetupInput,
  CreateBedInput,
  CreateFloorInput,
  CreateRoomInput,
  MarkBedPaidInput,
  UpdateBedInput,
  UpdateFloorInput,
  UpdateRoomLayoutInput,
} from "@pg-manager/shared";
import {
  badRequest,
  forbidden,
  notFound,
} from "../../common/httpErrors.js";
import { prisma } from "../../prisma/client.js";
import { floorMapService } from "../floor-map/floor-map.service.js";
import { PropertyRepository } from "./property.repository.js";

const BED_LETTERS = "ABCDEFGHIJKL".split("");

function bedLabelsForSharing(sharing: number): string[] {
  return BED_LETTERS.slice(0, Math.min(12, Math.max(1, sharing)));
}

function planRoomGridSlots(params: {
  gridColumns: number;
  count: number;
  colSpan: number;
  rowSpan: number;
}): Array<{ colStart: number; rowStart: number; colSpan: number; rowSpan: number }> {
  const { gridColumns, count, colSpan, rowSpan } = params;
  const out: Array<{ colStart: number; rowStart: number; colSpan: number; rowSpan: number }> = [];
  let col = 1;
  let row = 1;
  for (let i = 0; i < count; i++) {
    if (col + colSpan - 1 > gridColumns) {
      col = 1;
      row += rowSpan;
    }
    out.push({ colStart: col, colSpan, rowStart: row, rowSpan });
    col += colSpan;
  }
  return out;
}

export class PropertyService {
  constructor(private readonly repo = new PropertyRepository()) {}

  /** Delegates to floor-map module (single operational source of truth). */
  async getMap(organizationId: string) {
    const { floors } = await floorMapService.getOperationalFloors(organizationId);
    return floors;
  }

  /**
   * One-shot guided setup: creates a floor (if none), then rooms + beds from sharing counts.
   * Only allowed when the org has no active rooms yet (safe for first-time owners).
   */
  async bulkSetup(organizationId: string, input: BulkPropertySetupInput) {
    const existingBeds = await prisma.bed.count({
      where: {
        deletedAt: null,
        room: { deletedAt: null, floor: { organizationId, deletedAt: null } },
      },
    });
    if (existingBeds > 0) {
      throw badRequest(
        "Your property already has beds on the map. Add more rooms from the floor map, or delete existing rooms/beds first if you want to run quick setup again.",
      );
    }

    const planned: Array<{
      name: string;
      sharing: number;
      sharingLabel: string;
      monthlyRentMinor: number;
    }> = [];
    let roomNo = input.startingRoomNumber;
    for (const g of input.roomGroups) {
      const rent = g.monthlyRentMinor ?? input.defaultMonthlyRentMinor;
      const label = `${g.sharing}-sharing`;
      for (let i = 0; i < g.count; i++) {
        planned.push({
          name: String(roomNo),
          sharing: g.sharing,
          sharingLabel: label,
          monthlyRentMinor: rent,
        });
        roomNo += 1;
      }
    }

    const totalBeds = planned.reduce((s, p) => s + p.sharing, 0);

    await prisma.$transaction(async (tx) => {
      const now = new Date();
      /** Room shells with no beds (e.g. owner added a floor then got stuck) — remove so quick setup can run. */
      await tx.room.updateMany({
        where: { deletedAt: null, floor: { organizationId, deletedAt: null } },
        data: { deletedAt: now },
      });

      let floor = await tx.floor.findFirst({
        where: { organizationId, deletedAt: null },
        orderBy: { sortOrder: "asc" },
      });
      if (!floor) {
        floor = await tx.floor.create({
          data: {
            organizationId,
            name: input.floorName,
            sortOrder: 0,
            gridColumns: 12,
          },
        });
      }

      const gridColumns = floor.gridColumns;
      const colSpan = Math.min(4, Math.max(3, Math.floor(gridColumns / 4)));
      const rowSpan = 2;
      const slots = planRoomGridSlots({
        gridColumns,
        count: planned.length,
        colSpan,
        rowSpan,
      });

      const existingNames = new Set(
        (
          await tx.room.findMany({
            where: { floorId: floor.id, deletedAt: null },
            select: { name: true },
          })
        ).map((r) => r.name),
      );

      for (let i = 0; i < planned.length; i++) {
        const p = planned[i]!;
        const slot = slots[i]!;
        if (existingNames.has(p.name)) {
          throw badRequest(`Room number “${p.name}” already exists on this floor.`);
        }
        existingNames.add(p.name);

        const room = await tx.room.create({
          data: {
            floorId: floor.id,
            name: p.name,
            sharingLabel: p.sharingLabel,
            colStart: slot.colStart,
            colSpan: slot.colSpan,
            rowStart: slot.rowStart,
            rowSpan: slot.rowSpan,
            sortOrder: i,
          },
        });

        const labels = bedLabelsForSharing(p.sharing);
        for (const label of labels) {
          await tx.bed.create({
            data: {
              roomId: room.id,
              label,
              monthlyRentMinor: p.monthlyRentMinor,
              status: BedStatus.VACANT,
            },
          });
        }
      }
    });

    return {
      roomsCreated: planned.length,
      bedsCreated: totalBeds,
      floors: await this.getMap(organizationId),
    };
  }

  async getStats(organizationId: string) {
    const rows = await this.repo.bedsForOrgStats(organizationId);
    const counts: Record<BedStatus, number> = {
      OCCUPIED_PAID: 0,
      OCCUPIED_UNPAID: 0,
      VACANT: 0,
      UNDER_MAINTENANCE: 0,
    };
    let monthlyCollectedMinor = 0;
    let monthlyAtRiskMinor = 0;
    let monthlyPotentialMinor = 0;

    for (const row of rows) {
      counts[row.status] += 1;
      if (row.status === BedStatus.OCCUPIED_PAID) {
        monthlyCollectedMinor += row.monthlyRentMinor;
      }
      if (row.status === BedStatus.OCCUPIED_UNPAID) {
        monthlyAtRiskMinor += row.monthlyRentMinor;
      }
      if (
        row.status === BedStatus.OCCUPIED_PAID ||
        row.status === BedStatus.OCCUPIED_UNPAID
      ) {
        monthlyPotentialMinor += row.monthlyRentMinor;
      }
    }

    const totalBeds = rows.length;
    const vacantBeds = counts.VACANT;
    const occupancyRate =
      totalBeds === 0 ? 0 : (totalBeds - vacantBeds) / totalBeds;

    return {
      counts,
      totalBeds,
      occupancyRate,
      monthlyCollectedMinor,
      monthlyAtRiskMinor,
      monthlyPotentialMinor,
    };
  }

  async listTenantMembers(organizationId: string) {
    const rows = await this.repo.listTenantMembers(organizationId);
    return rows.map((m) => ({
      membershipId: m.id,
      user: m.user,
    }));
  }

  async createFloor(organizationId: string, input: CreateFloorInput) {
    const org = await prisma.organization.findFirst({
      where: { id: organizationId, deletedAt: null },
      select: { id: true },
    });
    if (!org) throw notFound("Organization not found");

    const name = input.name.trim();
    if (!name) throw badRequest("Floor name is required");

    const latest = await prisma.floor.findFirst({
      where: { organizationId, deletedAt: null },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });
    const sortOrder = input.sortOrder ?? (latest ? latest.sortOrder + 1 : 0);
    try {
      return await this.repo.createFloor({
        organization: { connect: { id: organizationId } },
        name,
        sortOrder,
        gridColumns: input.gridColumns ?? 12,
      });
    } catch (e) {
      console.error("createFloor failed", { organizationId, e });
      throw badRequest("Could not create floor. Please try again or use a different name.");
    }
  }

  async updateFloor(organizationId: string, floorId: string, input: UpdateFloorInput) {
    const floor = await this.repo.assertFloorInOrg(floorId, organizationId);
    if (!floor) throw notFound("Floor not found");
    return this.repo.updateFloor(floorId, input);
  }

  async deleteFloor(organizationId: string, floorId: string) {
    const floor = await this.repo.assertFloorInOrg(floorId, organizationId);
    if (!floor) throw notFound("Floor not found");

    await prisma.$transaction(async (tx) => {
      const now = new Date();
      const rooms = await tx.room.findMany({
        where: { floorId, deletedAt: null },
        select: { id: true },
      });
      const roomIds = rooms.map((r) => r.id);
      if (roomIds.length) {
        await tx.bed.updateMany({
          where: { roomId: { in: roomIds }, deletedAt: null },
          data: { deletedAt: now },
        });
        await tx.room.updateMany({
          where: { id: { in: roomIds } },
          data: { deletedAt: now },
        });
      }
      await tx.floor.update({
        where: { id: floorId },
        data: { deletedAt: now },
      });
    });
  }

  async createRoom(
    organizationId: string,
    floorId: string,
    input: CreateRoomInput,
  ) {
    const floor = await this.repo.assertFloorInOrg(floorId, organizationId);
    if (!floor) throw notFound("Floor not found");
    const dup = await prisma.room.findFirst({
      where: { floorId, name: input.name, deletedAt: null },
      select: { id: true },
    });
    if (dup) {
      throw badRequest(`A room named “${input.name}” already exists on this floor.`);
    }
    return this.repo.createRoom({
      floor: { connect: { id: floorId } },
      name: input.name,
      colStart: input.colStart,
      colSpan: input.colSpan,
      rowStart: input.rowStart,
      rowSpan: input.rowSpan,
      sortOrder: input.sortOrder ?? 0,
    });
  }

  async updateRoom(
    organizationId: string,
    roomId: string,
    input: UpdateRoomLayoutInput,
  ) {
    const room = await this.repo.assertRoomInOrg(roomId, organizationId);
    if (!room) throw notFound("Room not found");

    const data: Prisma.RoomUpdateInput = {};
    if (input.name !== undefined) data.name = input.name;
    if (input.sharingLabel !== undefined) data.sharingLabel = input.sharingLabel;
    if (input.colStart !== undefined) data.colStart = input.colStart;
    if (input.colSpan !== undefined) data.colSpan = input.colSpan;
    if (input.rowStart !== undefined) data.rowStart = input.rowStart;
    if (input.rowSpan !== undefined) data.rowSpan = input.rowSpan;
    if (input.sortOrder !== undefined) data.sortOrder = input.sortOrder;

    if (input.floorId !== undefined) {
      const target = await this.repo.assertFloorInOrg(input.floorId, organizationId);
      if (!target) throw notFound("Floor not found");
      data.floor = { connect: { id: input.floorId } };
    }

    return this.repo.updateRoom(roomId, data);
  }

  async deleteRoom(organizationId: string, roomId: string) {
    const room = await this.repo.assertRoomInOrg(roomId, organizationId);
    if (!room) throw notFound("Room not found");
    await prisma.$transaction(async (tx) => {
      const now = new Date();
      await tx.bed.updateMany({
        where: { roomId, deletedAt: null },
        data: { deletedAt: now },
      });
      await tx.room.update({ where: { id: roomId }, data: { deletedAt: now } });
    });
  }

  async createBed(organizationId: string, roomId: string, input: CreateBedInput) {
    const room = await this.repo.assertRoomInOrg(roomId, organizationId);
    if (!room) throw notFound("Room not found");
    return this.repo.createBed({
      room: { connect: { id: roomId } },
      label: input.label,
      monthlyRentMinor: input.monthlyRentMinor,
      status: BedStatus.VACANT,
    });
  }

  async updateBed(organizationId: string, bedId: string, input: UpdateBedInput) {
    const bed = await this.repo.assertBedInOrg(bedId, organizationId);
    if (!bed) throw notFound("Bed not found");

    const data: Prisma.BedUpdateInput = {};
    if (input.label !== undefined) data.label = input.label;
    if (input.monthlyRentMinor !== undefined) {
      data.monthlyRentMinor = input.monthlyRentMinor;
    }
    if (input.maintenanceNote !== undefined) {
      data.maintenanceNote = input.maintenanceNote;
    }
    if (input.status !== undefined) {
      data.status = input.status;
      if (input.status === BedStatus.VACANT) {
        data.tenant = { disconnect: true };
        data.assignedAt = null;
        data.paidThrough = null;
        data.maintenanceNote = null;
      }
      if (input.status === BedStatus.UNDER_MAINTENANCE) {
        data.tenant = { disconnect: true };
        data.assignedAt = null;
        data.paidThrough = null;
      }
    }

    return this.repo.updateBed(bedId, data);
  }

  async deleteBed(organizationId: string, bedId: string) {
    const bed = await this.repo.assertBedInOrg(bedId, organizationId);
    if (!bed) throw notFound("Bed not found");
    return this.repo.softDeleteBed(bedId);
  }

  async assignBed(
    organizationId: string,
    bedId: string,
    input: AssignBedInput,
  ) {
    const bed = await this.repo.assertBedInOrg(bedId, organizationId);
    if (!bed) throw notFound("Bed not found");
    if (bed.status === BedStatus.UNDER_MAINTENANCE) {
      throw badRequest("Bed is under maintenance");
    }

    const member = await this.repo.assertTenantMember(
      organizationId,
      input.tenantUserId,
    );
    if (!member) {
      throw forbidden("User is not an active tenant of this PG");
    }

    const updated = await this.repo.updateBed(bedId, {
      tenant: { connect: { id: input.tenantUserId } },
      assignedAt: new Date(),
      status: BedStatus.OCCUPIED_UNPAID,
      paidThrough: null,
    });
    await prisma.tenantHistory.create({
      data: {
        organizationId,
        tenantUserId: input.tenantUserId,
        eventType: "BED_ASSIGNED",
        payload: { bedId },
      },
    });
    return updated;
  }

  async vacateBed(organizationId: string, bedId: string) {
    const bed = await this.repo.assertBedInOrg(bedId, organizationId);
    if (!bed) throw notFound("Bed not found");
    const previousTenantId = bed.tenantUserId;
    const updated = await this.repo.updateBed(bedId, {
      tenant: { disconnect: true },
      assignedAt: null,
      paidThrough: null,
      status: BedStatus.VACANT,
      maintenanceNote: null,
    });
    if (previousTenantId) {
      await prisma.tenantHistory.create({
        data: {
          organizationId,
          tenantUserId: previousTenantId,
          eventType: "BED_VACATED",
          payload: { bedId },
        },
      });
    }
    return updated;
  }

  async markBedPaid(
    organizationId: string,
    bedId: string,
    input: MarkBedPaidInput,
  ) {
    const bed = await this.repo.assertBedInOrg(bedId, organizationId);
    if (!bed) throw notFound("Bed not found");
    if (!bed.tenantUserId) {
      throw badRequest("Assign a tenant before marking rent as paid");
    }
    const paidThrough = new Date(input.paidThrough);
    if (Number.isNaN(paidThrough.getTime())) {
      throw badRequest("Invalid paidThrough date");
    }
    return this.repo.updateBed(bedId, {
      status: BedStatus.OCCUPIED_PAID,
      paidThrough,
    });
  }
}
