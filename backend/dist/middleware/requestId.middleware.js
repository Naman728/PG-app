import { randomUUID } from "node:crypto";
/**
 * Propagates `X-Request-Id` for tracing across logs, errors, and downstream proxies.
 */
export function requestIdMiddleware(req, res, next) {
    const incoming = req.get("x-request-id");
    const id = incoming && incoming.trim().length > 0 ? incoming.trim() : randomUUID();
    res.locals.requestId = id;
    res.setHeader("X-Request-Id", id);
    next();
}
//# sourceMappingURL=requestId.middleware.js.map