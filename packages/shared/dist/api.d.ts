export type ApiSuccess<T> = {
    success: true;
    data: T;
    meta?: Record<string, unknown>;
};
export type ApiErrorBody = {
    success: false;
    error: {
        code: string;
        message: string;
        details?: unknown;
        /** Correlates with `X-Request-Id` response header and access logs. */
        requestId?: string;
    };
};
export type ApiResponse<T> = ApiSuccess<T> | ApiErrorBody;
//# sourceMappingURL=api.d.ts.map