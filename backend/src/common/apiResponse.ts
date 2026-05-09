import type { Response } from "express";
import type { ApiResponse as SharedApiResponse } from "@pg-manager/shared";

export function sendSuccess<T>(
  res: Response,
  data: T,
  status = 200,
  meta?: Record<string, unknown>,
): void {
  const body: SharedApiResponse<T> = meta
    ? { success: true, data, meta }
    : { success: true, data };
  res.status(status).json(body);
}

export function sendError(
  res: Response,
  status: number,
  code: string,
  message: string,
  details?: unknown,
): void {
  const requestId =
    typeof res.locals === "object" && res.locals && "requestId" in res.locals
      ? String((res.locals as { requestId?: string }).requestId ?? "")
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
