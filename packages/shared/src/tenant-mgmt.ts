import { z } from "zod";

/** Display-only mask; never send full Aadhaar to clients. */
export function maskAadhaarLast4(last4: string | null | undefined): string | null {
  if (!last4 || !/^\d{4}$/.test(last4)) return null;
  return `XXXX-XXXX-${last4}`;
}

export const tenantLifecycleStatusSchema = z.enum([
  "ONBOARDING",
  "PENDING_REVIEW",
  "ACTIVE",
  "MOVING_OUT",
  "MOVED_OUT",
  "SUSPENDED",
]);

export const tenantDocumentCategorySchema = z.enum([
  "AADHAAR_FRONT",
  "AADHAAR_BACK",
  "PROFILE_PHOTO",
  "RENT_AGREEMENT",
  "OTHER",
]);

export const tenantDocumentReviewStatusSchema = z.enum([
  "UPLOADED",
  "UNDER_REVIEW",
  "APPROVED",
  "REJECTED",
]);

/** Store last 4 digits only; full Aadhaar must never be sent or persisted. */
export const aadhaarLast4Schema = z
  .string()
  .regex(/^\d{4}$/, "Enter exactly the last 4 digits of Aadhaar")
  .optional()
  .nullable();

export const updateTenantProfileDto = z.object({
  name: z.string().min(1).max(120).optional(),
  /** ISO date `YYYY-MM-DD` or full ISO datetime; cleared with empty string → null on server. */
  dateOfBirth: z.string().max(40).optional().nullable(),
  occupation: z.string().max(120).optional().nullable(),
  permanentAddress: z.string().max(2000).optional().nullable(),
  aadhaarLast4: z
    .union([z.string().length(4).regex(/^\d{4}$/), z.literal("")])
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
});

export const createEmergencyContactDto = z.object({
  name: z.string().min(1).max(120),
  phone: z.string().min(8).max(20),
  relation: z.string().min(1).max(80),
  isPrimary: z.boolean().optional(),
});

export const updateEmergencyContactDto = z.object({
  name: z.string().min(1).max(120).optional(),
  phone: z.string().min(8).max(20).optional(),
  relation: z.string().min(1).max(80).optional(),
  isPrimary: z.boolean().optional(),
});

export const uploadDocumentMetaDto = z.object({
  category: tenantDocumentCategorySchema,
});

export const ownerTenantListQueryDto = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
  status: tenantLifecycleStatusSchema.optional(),
  q: z.string().max(200).optional(),
});

export const ownerUpdateTenantDto = z.object({
  status: tenantLifecycleStatusSchema,
  moveInAt: z.string().max(40).optional().nullable(),
  moveOutAt: z.string().max(40).optional().nullable(),
  statusNote: z.string().max(2000).optional().nullable(),
});

export const ownerReviewDocumentDto = z.object({
  reviewStatus: z.enum(["APPROVED", "REJECTED", "UNDER_REVIEW"]),
  reviewNote: z.string().max(500).optional().nullable(),
});

export const paginationQueryDto = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

export type UpdateTenantProfileInput = z.infer<typeof updateTenantProfileDto>;
export type CreateEmergencyContactInput = z.infer<typeof createEmergencyContactDto>;
export type UpdateEmergencyContactInput = z.infer<typeof updateEmergencyContactDto>;
export type UploadDocumentMetaInput = z.infer<typeof uploadDocumentMetaDto>;
export type OwnerTenantListQuery = z.infer<typeof ownerTenantListQueryDto>;
export type OwnerUpdateTenantInput = z.infer<typeof ownerUpdateTenantDto>;
export type OwnerReviewDocumentInput = z.infer<typeof ownerReviewDocumentDto>;
export type PaginationQuery = z.infer<typeof paginationQueryDto>;
