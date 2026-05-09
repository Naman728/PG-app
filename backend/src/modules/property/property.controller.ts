import type {
  AssignBedInput,
  BulkPropertySetupInput,
  CreateBedInput,
  CreateFloorInput,
  CreateRoomInput,
  MarkBedPaidInput,
  UpdateBedInput,
  UpdateFloorInput,
  UpdateRoomLayoutInput,
} from "@pg-manager/shared";
import { sendSuccess } from "../../common/apiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { PropertyService } from "./property.service.js";

const propertyService = new PropertyService();

export const getPropertyMap = asyncHandler(async (req, res) => {
  const orgId = req.params.orgId;
  const floors = await propertyService.getMap(orgId);
  sendSuccess(res, { floors });
});

export const getPropertyStats = asyncHandler(async (req, res) => {
  const orgId = req.params.orgId;
  const stats = await propertyService.getStats(orgId);
  sendSuccess(res, stats);
});

export const bulkPropertySetup = asyncHandler(async (req, res) => {
  const orgId = req.params.orgId;
  const body = req.body as BulkPropertySetupInput;
  const result = await propertyService.bulkSetup(orgId, body);
  sendSuccess(res, result);
});

export const listPropertyTenantMembers = asyncHandler(async (req, res) => {
  const orgId = req.params.orgId;
  const members = await propertyService.listTenantMembers(orgId);
  sendSuccess(res, { members });
});

export const createFloor = asyncHandler(async (req, res) => {
  const orgId = req.params.orgId;
  const body = req.body as CreateFloorInput;
  const floor = await propertyService.createFloor(orgId, body);
  sendSuccess(res, floor);
});

export const updateFloor = asyncHandler(async (req, res) => {
  const orgId = req.params.orgId;
  const floorId = req.params.floorId;
  const body = req.body as UpdateFloorInput;
  const floor = await propertyService.updateFloor(orgId, floorId, body);
  sendSuccess(res, floor);
});

export const deleteFloor = asyncHandler(async (req, res) => {
  const orgId = req.params.orgId;
  const floorId = req.params.floorId;
  await propertyService.deleteFloor(orgId, floorId);
  sendSuccess(res, { ok: true });
});

export const createRoom = asyncHandler(async (req, res) => {
  const orgId = req.params.orgId;
  const floorId = req.params.floorId;
  const body = req.body as CreateRoomInput;
  const room = await propertyService.createRoom(orgId, floorId, body);
  sendSuccess(res, room);
});

export const updateRoom = asyncHandler(async (req, res) => {
  const orgId = req.params.orgId;
  const roomId = req.params.roomId;
  const body = req.body as UpdateRoomLayoutInput;
  const room = await propertyService.updateRoom(orgId, roomId, body);
  sendSuccess(res, room);
});

export const deleteRoom = asyncHandler(async (req, res) => {
  const orgId = req.params.orgId;
  const roomId = req.params.roomId;
  await propertyService.deleteRoom(orgId, roomId);
  sendSuccess(res, { ok: true });
});

export const createBed = asyncHandler(async (req, res) => {
  const orgId = req.params.orgId;
  const roomId = req.params.roomId;
  const body = req.body as CreateBedInput;
  const bed = await propertyService.createBed(orgId, roomId, body);
  sendSuccess(res, bed);
});

export const updateBed = asyncHandler(async (req, res) => {
  const orgId = req.params.orgId;
  const bedId = req.params.bedId;
  const body = req.body as UpdateBedInput;
  const bed = await propertyService.updateBed(orgId, bedId, body);
  sendSuccess(res, bed);
});

export const deleteBed = asyncHandler(async (req, res) => {
  const orgId = req.params.orgId;
  const bedId = req.params.bedId;
  await propertyService.deleteBed(orgId, bedId);
  sendSuccess(res, { ok: true });
});

export const assignBed = asyncHandler(async (req, res) => {
  const orgId = req.params.orgId;
  const bedId = req.params.bedId;
  const body = req.body as AssignBedInput;
  const bed = await propertyService.assignBed(orgId, bedId, body);
  sendSuccess(res, bed);
});

export const vacateBed = asyncHandler(async (req, res) => {
  const orgId = req.params.orgId;
  const bedId = req.params.bedId;
  const bed = await propertyService.vacateBed(orgId, bedId);
  sendSuccess(res, bed);
});

export const markBedPaid = asyncHandler(async (req, res) => {
  const orgId = req.params.orgId;
  const bedId = req.params.bedId;
  const body = req.body as MarkBedPaidInput;
  const bed = await propertyService.markBedPaid(orgId, bedId, body);
  sendSuccess(res, bed);
});
