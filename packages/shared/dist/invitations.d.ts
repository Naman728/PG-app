import { z } from "zod";
export declare const inviteTenantDto: z.ZodObject<{
    phone: z.ZodString;
}, "strip", z.ZodTypeAny, {
    phone: string;
}, {
    phone: string;
}>;
export declare const invitationVerifyOtpDto: z.ZodObject<{
    code: z.ZodString;
}, "strip", z.ZodTypeAny, {
    code: string;
}, {
    code: string;
}>;
export type InviteTenantInput = z.infer<typeof inviteTenantDto>;
export type InvitationVerifyOtpInput = z.infer<typeof invitationVerifyOtpDto>;
//# sourceMappingURL=invitations.d.ts.map