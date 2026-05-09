import { sendSuccess } from "../../common/apiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { vacancyService } from "./vacancy.service.js";
const FILTERS = ["all", "fully_vacant", "partial", "ready"];
function parseVacancyFilter(raw) {
    if (typeof raw === "string" && FILTERS.includes(raw)) {
        return raw;
    }
    return "all";
}
export const getVacancySummary = asyncHandler(async (req, res) => {
    const orgId = req.params.orgId;
    const data = await vacancyService.summary(orgId);
    sendSuccess(res, data);
});
export const getVacancyRooms = asyncHandler(async (req, res) => {
    const orgId = req.params.orgId;
    const filter = parseVacancyFilter(req.query.filter);
    const data = await vacancyService.rooms(orgId, filter);
    sendSuccess(res, data);
});
//# sourceMappingURL=vacancy.controller.js.map