import type { User } from "@prisma/client";
import type { LoginInput, RegisterInput } from "@pg-manager/shared";
import { AuthRepository } from "./auth.repository.js";
export declare class AuthService {
    private readonly repo;
    constructor(repo?: AuthRepository);
    issueSessionTokens(user: User, meta: {
        userAgent?: string | null;
        ip?: string | null;
    }): Promise<{
        user: User;
        accessToken: string;
        refreshToken: string;
    }>;
    register(input: RegisterInput, meta: {
        userAgent?: string | null;
        ip?: string | null;
    }): Promise<{
        user: User;
        accessToken: string;
        refreshToken: string;
    }>;
    login(input: LoginInput, meta: {
        userAgent?: string | null;
        ip?: string | null;
    }): Promise<{
        user: User;
        accessToken: string;
        refreshToken: string;
    }>;
    refreshSession(refreshToken: string | undefined, meta: {
        userAgent?: string | null;
        ip?: string | null;
    }): Promise<{
        user: User;
        accessToken: string;
        refreshToken: string;
    }>;
    logout(refreshToken: string | undefined): Promise<void>;
}
