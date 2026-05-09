import { z } from "zod";

const e164Phone = z
  .string()
  .trim()
  .regex(/^\+[1-9]\d{6,14}$/, "Use E.164 format (e.g. +9198XXXXXXXX)");

export const inviteTenantDto = z.object({
  phone: e164Phone,
});

export const invitationVerifyOtpDto = z.object({
  code: z.string().trim().length(6, "OTP must be 6 digits"),
});

export type InviteTenantInput = z.infer<typeof inviteTenantDto>;
export type InvitationVerifyOtpInput = z.infer<typeof invitationVerifyOtpDto>;
