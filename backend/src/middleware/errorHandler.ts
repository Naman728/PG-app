import type { ErrorRequestHandler } from "express";
import { AppError } from "../common/httpErrors.js";
import { sendError } from "../common/apiResponse.js";
import { logger } from "../services/logger.service.js";

export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  if (res.headersSent) {
    next(err);
    return;
  }

  const requestId =
    typeof res.locals === "object" && res.locals && "requestId" in res.locals
      ? (res.locals as { requestId?: string }).requestId
      : undefined;

  if (err instanceof AppError) {
    if (err.status >= 500) {
      logger.error({
        message: "app_error",
        code: err.code,
        path: req.path,
        requestId,
        details: err.details,
      });
    }
    sendError(res, err.status, err.code, err.message, err.details);
    return;
  }

  logger.error({
    message: "unhandled_error",
    path: req.path,
    requestId,
    err,
  });
  sendError(
    res,
    500,
    "INTERNAL",
    "We could not complete this request. Please retry in a moment. If it keeps happening, contact support.",
    process.env.NODE_ENV === "development" && err instanceof Error
      ? { cause: err.message }
      : undefined,
  );
};
