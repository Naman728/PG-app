export declare class AppError extends Error {
    readonly status: number;
    readonly code: string;
    readonly details?: unknown;
    constructor(status: number, code: string, message: string, details?: unknown);
}
export declare const badRequest: (message: string, details?: unknown) => AppError;
export declare const unauthorized: (message?: string) => AppError;
export declare const forbidden: (message?: string) => AppError;
export declare const notFound: (message?: string) => AppError;
export declare const tooManyRequests: (message?: string) => AppError;
export declare const internal: (message?: string) => AppError;
