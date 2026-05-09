import type { z } from "zod";
export declare const registerDto: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    name: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
    name?: string | undefined;
}, {
    email: string;
    password: string;
    name?: unknown;
}>;
export declare const loginDto: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export type RegisterBody = z.infer<typeof registerDto>;
export type LoginBody = z.infer<typeof loginDto>;
