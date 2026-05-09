import { z } from "zod";
export declare const updateOrganizationProfileDto: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    city: z.ZodOptional<z.ZodString>;
    addressLine1: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    addressLine2: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    locality: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    pincode: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    completeOnboarding: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    city?: string | undefined;
    addressLine1?: string | null | undefined;
    addressLine2?: string | null | undefined;
    locality?: string | null | undefined;
    pincode?: string | null | undefined;
    completeOnboarding?: boolean | undefined;
}, {
    name?: string | undefined;
    city?: string | undefined;
    addressLine1?: string | null | undefined;
    addressLine2?: string | null | undefined;
    locality?: string | null | undefined;
    pincode?: string | null | undefined;
    completeOnboarding?: boolean | undefined;
}>;
export type UpdateOrganizationProfileInput = z.infer<typeof updateOrganizationProfileDto>;
//# sourceMappingURL=organization.d.ts.map