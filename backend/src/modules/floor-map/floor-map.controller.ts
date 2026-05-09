import { sendSuccess } from "../../common/apiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { floorMapService } from "./floor-map.service.js";

export const getFloorMap = asyncHandler(async (req, res) => {
  const orgId = req.params.orgId;
  const data = await floorMapService.getOperationalFloors(orgId);
  sendSuccess(res, data);
});

export const getRoomOperationalDetails = asyncHandler(async (req, res) => {
  const orgId = req.params.orgId;
  const roomId = req.params.roomId;
  const data = await floorMapService.getRoomDetails(orgId, roomId);
  sendSuccess(res, data);
});
