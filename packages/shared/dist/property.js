import { z } from "zod";
export const bedStatusSchema = z.enum([
    "OCCUPIED_PAID",
    "OCCUPIED_UNPAID",
    "VACANT",
    "UNDER_MAINTENANCE",
]);
export const createFloorDto = z.object({
    name: z.string().trim().min(1, "Enter a floor name").max(80),
    sortOrder: z.number().int().optional(),
    gridColumns: z.number().int().min(6).max(24).optional(),
});
export const updateFloorDto = z.object({
    name: z.string().min(1).max(80).optional(),
    sortOrder: z.number().int().optional(),
    gridColumns: z.number().int().min(6).max(24).optional(),
});
export const createRoomDto = z.object({
    name: z.string().min(1).max(80),
    colStart: z.number().int().min(1).max(48),
    colSpan: z.number().int().min(1).max(48),
    /** Tall vertical stacks (one column) need a high ceiling; was 200 (~100 rooms). */
    rowStart: z.number().int().min(1).max(5000),
    rowSpan: z.number().int().min(1).max(50),
    sortOrder: z.number().int().optional(),
});
export const updateRoomLayoutDto = z.object({
    name: z.string().min(1).max(80).optional(),
    /** Move room to another floor in the same organization. */
    floorId: z.string().uuid().optional(),
    sharingLabel: z.string().min(1).max(40).optional().nullable(),
    colStart: z.number().int().min(1).max(48).optional(),
    colSpan: z.number().int().min(1).max(48).optional(),
    rowStart: z.number().int().min(1).max(5000).optional(),
    rowSpan: z.number().int().min(1).max(50).optional(),
    sortOrder: z.number().int().optional(),
});
const roomGroupRow = z.object({
    sharing: z.coerce.number().int().min(1).max(12),
    count: z.coerce.number().int().min(1).max(200),
    /** Per-bed monthly rent (minor units) for this sharing group; falls back to `defaultMonthlyRentMinor`. */
    monthlyRentMinor: z.coerce.number().int().min(0).optional(),
});
/** Quick PG setup: generate many rooms + beds from sharing counts (one floor). */
export const bulkPropertySetupDto = z.object({
    floorName: z.string().min(1).max(80).default("Ground"),
    startingRoomNumber: z.coerce.number().int().min(1).max(9999).default(101),
    /** Used when a room group omits `monthlyRentMinor`. */
    defaultMonthlyRentMinor: z.coerce.number().int().min(0).default(0),
    roomGroups: z.array(roomGroupRow).min(1).max(30),
});
export const createBedDto = z.object({
    label: z.string().min(1).max(20),
    monthlyRentMinor: z.number().int().min(0),
});
export const updateBedDto = z.object({
    label: z.string().min(1).max(20).optional(),
    monthlyRentMinor: z.number().int().min(0).optional(),
    status: bedStatusSchema.optional(),
    maintenanceNote: z.string().max(500).optional().nullable(),
});
export const assignBedDto = z.object({
    tenantUserId: z.string().uuid(),
});
export const markBedPaidDto = z.object({
    paidThrough: z.string().datetime(),
});
