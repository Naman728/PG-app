import type { UpdateOrganizationProfileInput } from "@pg-manager/shared";
import { apiClient, unwrapApi } from "../lib/api-client";

export async function patchOrganizationProfile(
  organizationId: string,
  body: UpdateOrganizationProfileInput,
) {
  const res = await apiClient.patch(`/owner/organizations/${organizationId}`, body);
  return unwrapApi(res);
}

export async function listTenantInvitations(organizationId: string) {
  const res = await apiClient.get(
    `/owner/organizations/${organizationId}/tenant-invitations`,
  );
  return unwrapApi(res) as {
    invitations: Array<{
      id: string;
      phone: string;
      createdAt: string;
      expiresAt: string;
      invitedBy: { id: string; name: string | null; phone: string };
    }>;
  };
}

export async function createTenantInvitation(
  organizationId: string,
  body: { phone: string },
) {
  const res = await apiClient.post(
    `/owner/organizations/${organizationId}/tenant-invitations`,
    body,
  );
  return unwrapApi(res) as { id: string; expiresAt: string };
}
