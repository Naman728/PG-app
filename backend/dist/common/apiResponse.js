export function sendSuccess(res, data, status = 200, meta) {
    const body = meta
        ? { success: true, data, meta }
        : { success: true, data };
    res.status(status).json(body);
}
export function sendError(res, status, code, message, details) {
    const requestId = typeof res.locals === "object" && res.locals && "requestId" in res.locals
        ? String(res.locals.requestId ?? "")
        : "";
    res.status(status).json({
        success: false,
        error: {
            code,
            message,
            details,
            ...(requestId ? { requestId } : {}),
        },
    });
}
//# sourceMappingURL=apiResponse.js.map