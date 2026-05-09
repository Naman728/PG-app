import type { NextFunction, Request, Response } from "express";
import type { ZodSchema } from "zod";
import { badRequest } from "../common/httpErrors.js";

export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      next(badRequest("Validation failed", parsed.error.flatten()));
      return;
    }
    req.body = parsed.data as Request["body"];
    next();
  };
}
