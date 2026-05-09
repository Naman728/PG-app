import type { Prisma } from "@prisma/client";
export declare class PropertyRepository {
    assertFloorInOrg(floorId: string, organizationId: string): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        organizationId: string;
        sortOrder: number;
        gridColumns: number;
    } | null>;
    assertRoomInOrg(roomId: string, organizationId: string): Promise<{
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
    } | null>;
    assertBedInOrg(bedId: string, organizationId: string): Promise<{
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
    } | null>;
    listFloorsMap(organizationId: string): Promise<({
        rooms: ({
            beds: ({
                tenant: {
                    name: string | null;
                    id: string;
                    phone: string | null;
                    email: string | null;
                } | null;
            } & {
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
            })[];
        } & {
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
        })[];
    } & {
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        organizationId: string;
        sortOrder: number;
        gridColumns: number;
    })[]>;
    bedsForOrgStats(organizationId: string): Promise<{
        status: import("@prisma/client").$Enums.BedStatus;
        monthlyRentMinor: number;
    }[]>;
    listTenantMembers(organizationId: string): Promise<({
        user: {
            name: string | null;
            id: string;
            phone: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        organizationId: string;
        userId: string;
        orgRole: import("@prisma/client").$Enums.OrgRole;
    })[]>;
    assertTenantMember(organizationId: string, tenantUserId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        organizationId: string;
        userId: string;
        orgRole: import("@prisma/client").$Enums.OrgRole;
    } | null>;
    createFloor(data: Prisma.FloorCreateInput): Prisma.Prisma__FloorClient<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        organizationId: string;
        sortOrder: number;
        gridColumns: number;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, Prisma.PrismaClientOptions>;
    updateFloor(id: string, data: Prisma.FloorUpdateInput): Prisma.Prisma__FloorClient<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        organizationId: string;
        sortOrder: number;
        gridColumns: number;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, Prisma.PrismaClientOptions>;
    softDeleteFloor(id: string): Prisma.Prisma__FloorClient<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        organizationId: string;
        sortOrder: number;
        gridColumns: number;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, Prisma.PrismaClientOptions>;
    createRoom(data: Prisma.RoomCreateInput): Prisma.Prisma__RoomClient<{
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
    }, never, import("@prisma/client/runtime/library").DefaultArgs, Prisma.PrismaClientOptions>;
    updateRoom(id: string, data: Prisma.RoomUpdateInput): Prisma.Prisma__RoomClient<{
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
    }, never, import("@prisma/client/runtime/library").DefaultArgs, Prisma.PrismaClientOptions>;
    softDeleteRoom(id: string): Prisma.Prisma__RoomClient<{
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
    }, never, import("@prisma/client/runtime/library").DefaultArgs, Prisma.PrismaClientOptions>;
    createBed(data: Prisma.BedCreateInput): Prisma.Prisma__BedClient<{
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
    }, never, import("@prisma/client/runtime/library").DefaultArgs, Prisma.PrismaClientOptions>;
    updateBed(id: string, data: Prisma.BedUpdateInput): Prisma.Prisma__BedClient<{
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
    }, never, import("@prisma/client/runtime/library").DefaultArgs, Prisma.PrismaClientOptions>;
    softDeleteBed(id: string): Prisma.Prisma__BedClient<{
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
    }, never, import("@prisma/client/runtime/library").DefaultArgs, Prisma.PrismaClientOptions>;
}
