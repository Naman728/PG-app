import { sendSuccess } from "../../common/apiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { listTenantRentInvoices } from "./rent.service.js";
export const listMyRentInvoices = asyncHandler(async (req, res) => {
    const items = await listTenantRentInvoices(req.auth.userId);
    sendSuccess(res, { items });
});
//# sourceMappingURL=rent-tenant.controller.js.map