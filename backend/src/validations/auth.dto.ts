import { loginSchema, registerSchema } from "@pg-manager/shared";
import type { z } from "zod";

export const registerDto = registerSchema;
export const loginDto = loginSchema;

export type RegisterBody = z.infer<typeof registerDto>;
export type LoginBody = z.infer<typeof loginDto>;
