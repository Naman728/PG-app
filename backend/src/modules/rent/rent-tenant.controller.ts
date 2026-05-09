import type { Request, Response } from "express";
import { sendSuccess } from "../../common/apiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { listTenantRentInvoices } from "./rent.service.js";

export const listMyRentInvoices = asyncHandler(async (req: Request, res: Response) => {
  const items = await listTenantRentInvoices(req.auth!.userId);
  sendSuccess(res, { items });
});
