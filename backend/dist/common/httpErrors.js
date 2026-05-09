export class AppError extends Error {
    status;
    code;
    details;
    constructor(status, code, message, details) {
        super(message);
        this.status = status;
        this.code = code;
        this.details = details;
    }
}
export const badRequest = (message, details) => new AppError(400, "BAD_REQUEST", message, details);
export const unauthorized = (message = "Unauthorized") => new AppError(401, "UNAUTHORIZED", message);
export const forbidden = (message = "Forbidden") => new AppError(403, "FORBIDDEN", message);
export const notFound = (message = "Not found") => new AppError(404, "NOT_FOUND", message);
export const tooManyRequests = (message = "Too many requests") => new AppError(429, "RATE_LIMIT", message);
export const internal = (message = "Internal server error") => new AppError(500, "INTERNAL", message);
//# sourceMappingURL=httpErrors.js.map