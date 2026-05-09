import type { Response } from "express";
export declare function sendSuccess<T>(res: Response, data: T, status?: number, meta?: Record<string, unknown>): void;
export declare function sendError(res: Response, status: number, code: string, message: string, details?: unknown): void;
