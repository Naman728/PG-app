import { apiClient, unwrapApi } from "../lib/api-client";
import type { AuthUser } from "../store/auth.store";

export async function previewInvitation(token: string) {
  const res = await apiClient.get(`/auth/invitations/${token}/preview`);
  return unwrapApi(res) as {
    organizationName: string;
    city: string;
    phoneMasked: string;
  };
}

export async function requestInvitationOtp(token: string) {
  const res = await apiClient.post(`/auth/invitations/${token}/otp/request`);
  return unwrapApi(res) as { sent: true; expiresInSec: number };
}

export async function verifyInvitationOtp(token: string, body: { code: string }) {
  const res = await apiClient.post(`/auth/invitations/${token}/otp/verify`, body);
  return unwrapApi(res) as { accessToken: string; user: AuthUser };
}
