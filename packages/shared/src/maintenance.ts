import { z } from "zod";

export const MAINTENANCE_CATEGORIES = [
  "PLUMBING",
  "ELECTRICAL",
  "HVAC",
  "APPLIANCE",
  "FURNITURE",
  "PEST",
  "CLEANING",
  "STRUCTURAL",
  "INTERNET",
  "COMMON_AREA",
  "OTHER",
] as const;

export const maintenanceTicketCategorySchema = z.enum(MAINTENANCE_CATEGORIES);

export const maintenanceTicketPrioritySchema = z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]);

export const maintenanceTicketStatusSchema = z.enum([
  "OPEN",
  "ACKNOWLEDGED",
  "IN_PROGRESS",
  "BLOCKED",
  "RESOLVED",
  "CLOSED",
]);

export const maintenanceMessageVisibilitySchema = z.enum(["INTERNAL", "TENANT"]);

export const createMaintenanceTicketDto = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(8000),
  category: maintenanceTicketCategorySchema,
  priority: maintenanceTicketPrioritySchema.default("MEDIUM"),
  bedId: z.string().uuid().optional().nullable(),
});

export type CreateMaintenanceTicketInput = z.infer<typeof createMaintenanceTicketDto>;

export const listMaintenanceTicketsQueryDto = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  status: maintenanceTicketStatusSchema.optional(),
  category: maintenanceTicketCategorySchema.optional(),
  priority: maintenanceTicketPrioritySchema.optional(),
  assignedToUserId: z.string().uuid().optional(),
  q: z.string().max(200).optional(),
});

export type ListMaintenanceTicketsQuery = z.infer<typeof listMaintenanceTicketsQueryDto>;

export const patchMaintenanceTicketDto = z
  .object({
    assignedToUserId: z.string().uuid().nullable().optional(),
    priority: maintenanceTicketPrioritySchema.optional(),
    resolutionCostMinor: z.number().int().min(0).nullable().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: "At least one field required" });

export type PatchMaintenanceTicketInput = z.infer<typeof patchMaintenanceTicketDto>;

export const maintenanceTicketStatusBodyDto = z.object({
  status: maintenanceTicketStatusSchema,
  resolutionSummary: z.string().max(4000).optional().nullable(),
});

export type MaintenanceTicketStatusBody = z.infer<typeof maintenanceTicketStatusBodyDto>;

export const addMaintenanceMessageDto = z.object({
  body: z.string().min(1).max(8000),
  visibility: maintenanceMessageVisibilitySchema.default("TENANT"),
});

export type AddMaintenanceMessageInput = z.infer<typeof addMaintenanceMessageDto>;

export const submitMaintenanceRatingDto = z.object({
  rating: z.number().int().min(1).max(5),
  feedback: z.string().max(2000).optional().nullable(),
});

export type SubmitMaintenanceRatingInput = z.infer<typeof submitMaintenanceRatingDto>;

export const maintenanceMetricsQueryDto = z.object({
  from: z.string().min(1),
  to: z.string().min(1),
});

export type MaintenanceMetricsQuery = z.infer<typeof maintenanceMetricsQueryDto>;
