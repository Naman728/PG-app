import { z } from "zod";
/** Display-only mask; never send full Aadhaar to clients. */
export declare function maskAadhaarLast4(last4: string | null | undefined): string | null;
export declare const tenantLifecycleStatusSchema: z.ZodEnum<["ONBOARDING", "PENDING_REVIEW", "ACTIVE", "MOVING_OUT", "MOVED_OUT", "SUSPENDED"]>;
export declare const tenantDocumentCategorySchema: z.ZodEnum<["AADHAAR_FRONT", "AADHAAR_BACK", "PROFILE_PHOTO", "RENT_AGREEMENT", "OTHER"]>;
export declare const tenantDocumentReviewStatusSchema: z.ZodEnum<["UPLOADED", "UNDER_REVIEW", "APPROVED", "REJECTED"]>;
/** Store last 4 digits only; full Aadhaar must never be sent or persisted. */
export declare const aadhaarLast4Schema: z.ZodNullable<z.ZodOptional<z.ZodString>>;
export declare const updateTenantProfileDto: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    /** ISO date `YYYY-MM-DD` or full ISO datetime; cleared with empty string → null on server. */
    dateOfBirth: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    occupation: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    permanentAddress: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    aadhaarLast4: z.ZodEffects<z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodLiteral<"">]>>, string | undefined, string | undefined>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    dateOfBirth?: string | null | undefined;
    occupation?: string | null | undefined;
    permanentAddress?: string | null | undefined;
    aadhaarLast4?: string | undefined;
}, {
    name?: string | undefined;
    dateOfBirth?: string | null | undefined;
    occupation?: string | null | undefined;
    permanentAddress?: string | null | undefined;
    aadhaarLast4?: string | undefined;
}>;
export declare const createEmergencyContactDto: z.ZodObject<{
    name: z.ZodString;
    phone: z.ZodString;
    relation: z.ZodString;
    isPrimary: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    name: string;
    phone: string;
    relation: string;
    isPrimary?: boolean | undefined;
}, {
    name: string;
    phone: string;
    relation: string;
    isPrimary?: boolean | undefined;
}>;
export declare const updateEmergencyContactDto: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    relation: z.ZodOptional<z.ZodString>;
    isPrimary: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    phone?: string | undefined;
    relation?: string | undefined;
    isPrimary?: boolean | undefined;
}, {
    name?: string | undefined;
    phone?: string | undefined;
    relation?: string | undefined;
    isPrimary?: boolean | undefined;
}>;
export declare const uploadDocumentMetaDto: z.ZodObject<{
    category: z.ZodEnum<["AADHAAR_FRONT", "AADHAAR_BACK", "PROFILE_PHOTO", "RENT_AGREEMENT", "OTHER"]>;
}, "strip", z.ZodTypeAny, {
    category: "AADHAAR_FRONT" | "AADHAAR_BACK" | "PROFILE_PHOTO" | "RENT_AGREEMENT" | "OTHER";
}, {
    category: "AADHAAR_FRONT" | "AADHAAR_BACK" | "PROFILE_PHOTO" | "RENT_AGREEMENT" | "OTHER";
}>;
export declare const ownerTenantListQueryDto: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    pageSize: z.ZodDefault<z.ZodNumber>;
    status: z.ZodOptional<z.ZodEnum<["ONBOARDING", "PENDING_REVIEW", "ACTIVE", "MOVING_OUT", "MOVED_OUT", "SUSPENDED"]>>;
    q: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    page: number;
    pageSize: number;
    status?: "ONBOARDING" | "PENDING_REVIEW" | "ACTIVE" | "MOVING_OUT" | "MOVED_OUT" | "SUSPENDED" | undefined;
    q?: string | undefined;
}, {
    status?: "ONBOARDING" | "PENDING_REVIEW" | "ACTIVE" | "MOVING_OUT" | "MOVED_OUT" | "SUSPENDED" | undefined;
    page?: number | undefined;
    pageSize?: number | undefined;
    q?: string | undefined;
}>;
export declare const ownerUpdateTenantDto: z.ZodObject<{
    status: z.ZodEnum<["ONBOARDING", "PENDING_REVIEW", "ACTIVE", "MOVING_OUT", "MOVED_OUT", "SUSPENDED"]>;
    moveInAt: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    moveOutAt: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    statusNote: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    status: "ONBOARDING" | "PENDING_REVIEW" | "ACTIVE" | "MOVING_OUT" | "MOVED_OUT" | "SUSPENDED";
    moveInAt?: string | null | undefined;
    moveOutAt?: string | null | undefined;
    statusNote?: string | null | undefined;
}, {
    status: "ONBOARDING" | "PENDING_REVIEW" | "ACTIVE" | "MOVING_OUT" | "MOVED_OUT" | "SUSPENDED";
    moveInAt?: string | null | undefined;
    moveOutAt?: string | null | undefined;
    statusNote?: string | null | undefined;
}>;
export declare const ownerReviewDocumentDto: z.ZodObject<{
    reviewStatus: z.ZodEnum<["APPROVED", "REJECTED", "UNDER_REVIEW"]>;
    reviewNote: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    reviewStatus: "UNDER_REVIEW" | "APPROVED" | "REJECTED";
    reviewNote?: string | null | undefined;
}, {
    reviewStatus: "UNDER_REVIEW" | "APPROVED" | "REJECTED";
    reviewNote?: string | null | undefined;
}>;
export declare const paginationQueryDto: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    pageSize: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    page: number;
    pageSize: number;
}, {
    page?: number | undefined;
    pageSize?: number | undefined;
}>;
export type UpdateTenantProfileInput = z.infer<typeof updateTenantProfileDto>;
export type CreateEmergencyContactInput = z.infer<typeof createEmergencyContactDto>;
export type UpdateEmergencyContactInput = z.infer<typeof updateEmergencyContactDto>;
export type UploadDocumentMetaInput = z.infer<typeof uploadDocumentMetaDto>;
export type OwnerTenantListQuery = z.infer<typeof ownerTenantListQueryDto>;
export type OwnerUpdateTenantInput = z.infer<typeof ownerUpdateTenantDto>;
export type OwnerReviewDocumentInput = z.infer<typeof ownerReviewDocumentDto>;
export type PaginationQuery = z.infer<typeof paginationQueryDto>;
//# sourceMappingURL=tenant-mgmt.d.ts.map