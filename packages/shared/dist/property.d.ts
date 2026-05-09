import { z } from "zod";
export declare const bedStatusSchema: z.ZodEnum<["OCCUPIED_PAID", "OCCUPIED_UNPAID", "VACANT", "UNDER_MAINTENANCE"]>;
export declare const createFloorDto: z.ZodObject<{
    name: z.ZodString;
    sortOrder: z.ZodOptional<z.ZodNumber>;
    gridColumns: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    name: string;
    sortOrder?: number | undefined;
    gridColumns?: number | undefined;
}, {
    name: string;
    sortOrder?: number | undefined;
    gridColumns?: number | undefined;
}>;
export declare const updateFloorDto: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    sortOrder: z.ZodOptional<z.ZodNumber>;
    gridColumns: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    sortOrder?: number | undefined;
    gridColumns?: number | undefined;
}, {
    name?: string | undefined;
    sortOrder?: number | undefined;
    gridColumns?: number | undefined;
}>;
export declare const createRoomDto: z.ZodObject<{
    name: z.ZodString;
    colStart: z.ZodNumber;
    colSpan: z.ZodNumber;
    /** Tall vertical stacks (one column) need a high ceiling; was 200 (~100 rooms). */
    rowStart: z.ZodNumber;
    rowSpan: z.ZodNumber;
    sortOrder: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    name: string;
    colStart: number;
    colSpan: number;
    rowStart: number;
    rowSpan: number;
    sortOrder?: number | undefined;
}, {
    name: string;
    colStart: number;
    colSpan: number;
    rowStart: number;
    rowSpan: number;
    sortOrder?: number | undefined;
}>;
export declare const updateRoomLayoutDto: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    /** Move room to another floor in the same organization. */
    floorId: z.ZodOptional<z.ZodString>;
    sharingLabel: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    colStart: z.ZodOptional<z.ZodNumber>;
    colSpan: z.ZodOptional<z.ZodNumber>;
    rowStart: z.ZodOptional<z.ZodNumber>;
    rowSpan: z.ZodOptional<z.ZodNumber>;
    sortOrder: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    sortOrder?: number | undefined;
    colStart?: number | undefined;
    colSpan?: number | undefined;
    rowStart?: number | undefined;
    rowSpan?: number | undefined;
    floorId?: string | undefined;
    sharingLabel?: string | null | undefined;
}, {
    name?: string | undefined;
    sortOrder?: number | undefined;
    colStart?: number | undefined;
    colSpan?: number | undefined;
    rowStart?: number | undefined;
    rowSpan?: number | undefined;
    floorId?: string | undefined;
    sharingLabel?: string | null | undefined;
}>;
/** Quick PG setup: generate many rooms + beds from sharing counts (one floor). */
export declare const bulkPropertySetupDto: z.ZodObject<{
    floorName: z.ZodDefault<z.ZodString>;
    startingRoomNumber: z.ZodDefault<z.ZodNumber>;
    /** Used when a room group omits `monthlyRentMinor`. */
    defaultMonthlyRentMinor: z.ZodDefault<z.ZodNumber>;
    roomGroups: z.ZodArray<z.ZodObject<{
        sharing: z.ZodNumber;
        count: z.ZodNumber;
        /** Per-bed monthly rent (minor units) for this sharing group; falls back to `defaultMonthlyRentMinor`. */
        monthlyRentMinor: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        sharing: number;
        count: number;
        monthlyRentMinor?: number | undefined;
    }, {
        sharing: number;
        count: number;
        monthlyRentMinor?: number | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    floorName: string;
    startingRoomNumber: number;
    defaultMonthlyRentMinor: number;
    roomGroups: {
        sharing: number;
        count: number;
        monthlyRentMinor?: number | undefined;
    }[];
}, {
    roomGroups: {
        sharing: number;
        count: number;
        monthlyRentMinor?: number | undefined;
    }[];
    floorName?: string | undefined;
    startingRoomNumber?: number | undefined;
    defaultMonthlyRentMinor?: number | undefined;
}>;
export declare const createBedDto: z.ZodObject<{
    label: z.ZodString;
    monthlyRentMinor: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    monthlyRentMinor: number;
    label: string;
}, {
    monthlyRentMinor: number;
    label: string;
}>;
export declare const updateBedDto: z.ZodObject<{
    label: z.ZodOptional<z.ZodString>;
    monthlyRentMinor: z.ZodOptional<z.ZodNumber>;
    status: z.ZodOptional<z.ZodEnum<["OCCUPIED_PAID", "OCCUPIED_UNPAID", "VACANT", "UNDER_MAINTENANCE"]>>;
    maintenanceNote: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    status?: "OCCUPIED_PAID" | "OCCUPIED_UNPAID" | "VACANT" | "UNDER_MAINTENANCE" | undefined;
    monthlyRentMinor?: number | undefined;
    label?: string | undefined;
    maintenanceNote?: string | null | undefined;
}, {
    status?: "OCCUPIED_PAID" | "OCCUPIED_UNPAID" | "VACANT" | "UNDER_MAINTENANCE" | undefined;
    monthlyRentMinor?: number | undefined;
    label?: string | undefined;
    maintenanceNote?: string | null | undefined;
}>;
export declare const assignBedDto: z.ZodObject<{
    tenantUserId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    tenantUserId: string;
}, {
    tenantUserId: string;
}>;
export declare const markBedPaidDto: z.ZodObject<{
    paidThrough: z.ZodString;
}, "strip", z.ZodTypeAny, {
    paidThrough: string;
}, {
    paidThrough: string;
}>;
export type CreateFloorInput = z.infer<typeof createFloorDto>;
export type UpdateFloorInput = z.infer<typeof updateFloorDto>;
export type CreateRoomInput = z.infer<typeof createRoomDto>;
export type UpdateRoomLayoutInput = z.infer<typeof updateRoomLayoutDto>;
export type BulkPropertySetupInput = z.infer<typeof bulkPropertySetupDto>;
export type CreateBedInput = z.infer<typeof createBedDto>;
export type UpdateBedInput = z.infer<typeof updateBedDto>;
export type AssignBedInput = z.infer<typeof assignBedDto>;
export type MarkBedPaidInput = z.infer<typeof markBedPaidDto>;
//# sourceMappingURL=property.d.ts.map