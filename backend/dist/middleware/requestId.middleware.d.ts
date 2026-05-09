import type { NextFunction, Request, Response } from "express";
/**
 * Propagates `X-Request-Id` for tracing across logs, errors, and downstream proxies.
 */
export declare function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void;
