import { z } from "zod";
export const updateOrganizationProfileDto = z.object({
    name: z.string().min(2).max(120).optional(),
    city: z.string().min(2).max(80).optional(),
    addressLine1: z.string().max(200).optional().nullable(),
    addressLine2: z.string().max(200).optional().nullable(),
    locality: z.string().max(120).optional().nullable(),
    pincode: z.string().max(12).optional().nullable(),
    completeOnboarding: z.boolean().optional(),
});
