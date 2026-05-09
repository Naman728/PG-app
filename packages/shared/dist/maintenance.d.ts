import { z } from "zod";
export declare const MAINTENANCE_CATEGORIES: readonly ["PLUMBING", "ELECTRICAL", "HVAC", "APPLIANCE", "FURNITURE", "PEST", "CLEANING", "STRUCTURAL", "INTERNET", "COMMON_AREA", "OTHER"];
export declare const maintenanceTicketCategorySchema: z.ZodEnum<["PLUMBING", "ELECTRICAL", "HVAC", "APPLIANCE", "FURNITURE", "PEST", "CLEANING", "STRUCTURAL", "INTERNET", "COMMON_AREA", "OTHER"]>;
export declare const maintenanceTicketPrioritySchema: z.ZodEnum<["LOW", "MEDIUM", "HIGH", "URGENT"]>;
export declare const maintenanceTicketStatusSchema: z.ZodEnum<["OPEN", "ACKNOWLEDGED", "IN_PROGRESS", "BLOCKED", "RESOLVED", "CLOSED"]>;
export declare const maintenanceMessageVisibilitySchema: z.ZodEnum<["INTERNAL", "TENANT"]>;
export declare const createMaintenanceTicketDto: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodString;
    category: z.ZodEnum<["PLUMBING", "ELECTRICAL", "HVAC", "APPLIANCE", "FURNITURE", "PEST", "CLEANING", "STRUCTURAL", "INTERNET", "COMMON_AREA", "OTHER"]>;
    priority: z.ZodDefault<z.ZodEnum<["LOW", "MEDIUM", "HIGH", "URGENT"]>>;
    bedId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    category: "OTHER" | "PLUMBING" | "ELECTRICAL" | "HVAC" | "APPLIANCE" | "FURNITURE" | "PEST" | "CLEANING" | "STRUCTURAL" | "INTERNET" | "COMMON_AREA";
    title: string;
    description: string;
    priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
    bedId?: string | null | undefined;
}, {
    category: "OTHER" | "PLUMBING" | "ELECTRICAL" | "HVAC" | "APPLIANCE" | "FURNITURE" | "PEST" | "CLEANING" | "STRUCTURAL" | "INTERNET" | "COMMON_AREA";
    title: string;
    description: string;
    priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT" | undefined;
    bedId?: string | null | undefined;
}>;
export type CreateMaintenanceTicketInput = z.infer<typeof createMaintenanceTicketDto>;
export declare const listMaintenanceTicketsQueryDto: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    pageSize: z.ZodDefault<z.ZodNumber>;
    status: z.ZodOptional<z.ZodEnum<["OPEN", "ACKNOWLEDGED", "IN_PROGRESS", "BLOCKED", "RESOLVED", "CLOSED"]>>;
    category: z.ZodOptional<z.ZodEnum<["PLUMBING", "ELECTRICAL", "HVAC", "APPLIANCE", "FURNITURE", "PEST", "CLEANING", "STRUCTURAL", "INTERNET", "COMMON_AREA", "OTHER"]>>;
    priority: z.ZodOptional<z.ZodEnum<["LOW", "MEDIUM", "HIGH", "URGENT"]>>;
    assignedToUserId: z.ZodOptional<z.ZodString>;
    q: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    page: number;
    pageSize: number;
    status?: "OPEN" | "ACKNOWLEDGED" | "IN_PROGRESS" | "BLOCKED" | "RESOLVED" | "CLOSED" | undefined;
    category?: "OTHER" | "PLUMBING" | "ELECTRICAL" | "HVAC" | "APPLIANCE" | "FURNITURE" | "PEST" | "CLEANING" | "STRUCTURAL" | "INTERNET" | "COMMON_AREA" | undefined;
    q?: string | undefined;
    priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT" | undefined;
    assignedToUserId?: string | undefined;
}, {
    status?: "OPEN" | "ACKNOWLEDGED" | "IN_PROGRESS" | "BLOCKED" | "RESOLVED" | "CLOSED" | undefined;
    category?: "OTHER" | "PLUMBING" | "ELECTRICAL" | "HVAC" | "APPLIANCE" | "FURNITURE" | "PEST" | "CLEANING" | "STRUCTURAL" | "INTERNET" | "COMMON_AREA" | undefined;
    page?: number | undefined;
    pageSize?: number | undefined;
    q?: string | undefined;
    priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT" | undefined;
    assignedToUserId?: string | undefined;
}>;
export type ListMaintenanceTicketsQuery = z.infer<typeof listMaintenanceTicketsQueryDto>;
export declare const patchMaintenanceTicketDto: z.ZodEffects<z.ZodObject<{
    assignedToUserId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    priority: z.ZodOptional<z.ZodEnum<["LOW", "MEDIUM", "HIGH", "URGENT"]>>;
    resolutionCostMinor: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT" | undefined;
    assignedToUserId?: string | null | undefined;
    resolutionCostMinor?: number | null | undefined;
}, {
    priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT" | undefined;
    assignedToUserId?: string | null | undefined;
    resolutionCostMinor?: number | null | undefined;
}>, {
    priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT" | undefined;
    assignedToUserId?: string | null | undefined;
    resolutionCostMinor?: number | null | undefined;
}, {
    priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT" | undefined;
    assignedToUserId?: string | null | undefined;
    resolutionCostMinor?: number | null | undefined;
}>;
export type PatchMaintenanceTicketInput = z.infer<typeof patchMaintenanceTicketDto>;
export declare const maintenanceTicketStatusBodyDto: z.ZodObject<{
    status: z.ZodEnum<["OPEN", "ACKNOWLEDGED", "IN_PROGRESS", "BLOCKED", "RESOLVED", "CLOSED"]>;
    resolutionSummary: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    status: "OPEN" | "ACKNOWLEDGED" | "IN_PROGRESS" | "BLOCKED" | "RESOLVED" | "CLOSED";
    resolutionSummary?: string | null | undefined;
}, {
    status: "OPEN" | "ACKNOWLEDGED" | "IN_PROGRESS" | "BLOCKED" | "RESOLVED" | "CLOSED";
    resolutionSummary?: string | null | undefined;
}>;
export type MaintenanceTicketStatusBody = z.infer<typeof maintenanceTicketStatusBodyDto>;
export declare const addMaintenanceMessageDto: z.ZodObject<{
    body: z.ZodString;
    visibility: z.ZodDefault<z.ZodEnum<["INTERNAL", "TENANT"]>>;
}, "strip", z.ZodTypeAny, {
    body: string;
    visibility: "INTERNAL" | "TENANT";
}, {
    body: string;
    visibility?: "INTERNAL" | "TENANT" | undefined;
}>;
export type AddMaintenanceMessageInput = z.infer<typeof addMaintenanceMessageDto>;
export declare const submitMaintenanceRatingDto: z.ZodObject<{
    rating: z.ZodNumber;
    feedback: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    rating: number;
    feedback?: string | null | undefined;
}, {
    rating: number;
    feedback?: string | null | undefined;
}>;
export type SubmitMaintenanceRatingInput = z.infer<typeof submitMaintenanceRatingDto>;
export declare const maintenanceMetricsQueryDto: z.ZodObject<{
    from: z.ZodString;
    to: z.ZodString;
}, "strip", z.ZodTypeAny, {
    from: string;
    to: string;
}, {
    from: string;
    to: string;
}>;
export type MaintenanceMetricsQuery = z.infer<typeof maintenanceMetricsQueryDto>;
//# sourceMappingURL=maintenance.d.ts.map