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
import { apiClient, unwrapApi } from "../lib/api-client";
import type {
  PropertyMapFloor,
  PropertyStats,
  PropertyTenantMember,
} from "../types/property";

export type FloorMapMeta = { generatedAt: string };

/** React Query key for `/floor-map` (invalidate after rent, beds, maintenance). */
export function floorMapQueryKey(organizationId: string | undefined | null) {
  return ["floor-map", organizationId] as const;
}

/** Operational floor map (authoritative — server-derived occupancy & rent signals). */
export async function fetchFloorMap(organizationId: string) {
  const res = await apiClient.get(`/owner/organizations/${organizationId}/floor-map`);
  return unwrapApi(res) as { floors: PropertyMapFloor[]; meta: FloorMapMeta };
}

/** @deprecated Use fetchFloorMap — alias kept for gradual migration. */
export async function fetchPropertyMap(organizationId: string) {
  const { floors } = await fetchFloorMap(organizationId);
  return { floors };
}

export async function bulkPropertyQuickSetupApi(
  organizationId: string,
  body: BulkPropertySetupInput,
) {
  const res = await apiClient.post(
    `/owner/organizations/${organizationId}/property/quick-setup`,
    body,
  );
  return unwrapApi(res) as { roomsCreated: number; bedsCreated: number; floors: PropertyMapFloor[] };
}

export type InAppNotificationItem = {
  id: string;
  category: string;
  title: string;
  body: string;
  readAt: string | null;
  createdAt: string;
  metadata: unknown;
};

export async function fetchInAppNotifications(organizationId: string, take = 40) {
  const res = await apiClient.get(
    `/owner/organizations/${organizationId}/notifications?take=${take}`,
  );
  return unwrapApi(res) as { items: InAppNotificationItem[]; unread: number };
}

export async function markNotificationReadApi(organizationId: string, notificationId: string) {
  const res = await apiClient.patch(
    `/owner/organizations/${organizationId}/notifications/${notificationId}/read`,
  );
  return unwrapApi(res);
}

export async function markAllNotificationsReadApi(organizationId: string) {
  const res = await apiClient.post(
    `/owner/organizations/${organizationId}/notifications/read-all`,
  );
  return unwrapApi(res);
}

export async function fetchPropertyStats(organizationId: string) {
  const res = await apiClient.get(
    `/owner/organizations/${organizationId}/property/stats`,
  );
  return unwrapApi(res) as PropertyStats;
}

export async function fetchPropertyTenantMembers(organizationId: string) {
  const res = await apiClient.get(
    `/owner/organizations/${organizationId}/property/tenant-members`,
  );
  return unwrapApi(res) as { members: PropertyTenantMember[] };
}

export type CreatedFloor = {
  id: string;
  name: string;
  sortOrder: number;
  gridColumns: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export async function createFloorApi(
  organizationId: string,
  body: CreateFloorInput,
): Promise<CreatedFloor> {
  const res = await apiClient.post(
    `/owner/organizations/${organizationId}/floors`,
    body,
  );
  return unwrapApi(res) as CreatedFloor;
}

export async function updateFloorApi(
  organizationId: string,
  floorId: string,
  body: UpdateFloorInput,
) {
  const res = await apiClient.patch(
    `/owner/organizations/${organizationId}/floors/${floorId}`,
    body,
  );
  return unwrapApi(res);
}

export async function deleteFloorApi(organizationId: string, floorId: string) {
  const res = await apiClient.delete(
    `/owner/organizations/${organizationId}/floors/${floorId}`,
  );
  return unwrapApi(res);
}

export async function createRoomApi(
  organizationId: string,
  floorId: string,
  body: CreateRoomInput,
) {
  const res = await apiClient.post(
    `/owner/organizations/${organizationId}/floors/${floorId}/rooms`,
    body,
  );
  return unwrapApi(res);
}

export async function updateRoomApi(
  organizationId: string,
  roomId: string,
  body: UpdateRoomLayoutInput,
) {
  const res = await apiClient.patch(
    `/owner/organizations/${organizationId}/rooms/${roomId}`,
    body,
  );
  return unwrapApi(res);
}

export async function deleteRoomApi(organizationId: string, roomId: string) {
  const res = await apiClient.delete(
    `/owner/organizations/${organizationId}/rooms/${roomId}`,
  );
  return unwrapApi(res);
}

export async function createBedApi(
  organizationId: string,
  roomId: string,
  body: CreateBedInput,
) {
  const res = await apiClient.post(
    `/owner/organizations/${organizationId}/rooms/${roomId}/beds`,
    body,
  );
  return unwrapApi(res);
}

export async function updateBedApi(
  organizationId: string,
  bedId: string,
  body: UpdateBedInput,
) {
  const res = await apiClient.patch(
    `/owner/organizations/${organizationId}/beds/${bedId}`,
    body,
  );
  return unwrapApi(res);
}

export async function deleteBedApi(organizationId: string, bedId: string) {
  const res = await apiClient.delete(
    `/owner/organizations/${organizationId}/beds/${bedId}`,
  );
  return unwrapApi(res);
}

export async function assignBedApi(
  organizationId: string,
  bedId: string,
  body: AssignBedInput,
) {
  const res = await apiClient.post(
    `/owner/organizations/${organizationId}/beds/${bedId}/assign`,
    body,
  );
  return unwrapApi(res);
}

export async function vacateBedApi(organizationId: string, bedId: string) {
  const res = await apiClient.post(
    `/owner/organizations/${organizationId}/beds/${bedId}/vacate`,
  );
  return unwrapApi(res);
}

export async function markBedPaidApi(
  organizationId: string,
  bedId: string,
  body: MarkBedPaidInput,
) {
  const res = await apiClient.post(
    `/owner/organizations/${organizationId}/beds/${bedId}/mark-paid`,
    body,
  );
  return unwrapApi(res);
}
