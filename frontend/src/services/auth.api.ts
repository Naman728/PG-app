import { apiClient, unwrapApi } from "../lib/api-client";
import type { SessionProfile } from "../types/session";
import type { AuthUser } from "../store/auth.store";

export async function fetchMe(): Promise<SessionProfile> {
  const res = await apiClient.get(`/auth/me`);
  return unwrapApi(res) as SessionProfile;
}

export async function refreshSession(): Promise<{
  accessToken: string;
  user: AuthUser;
}> {
  const res = await apiClient.post(`/auth/refresh`);
  return unwrapApi(res);
}

export async function logoutApi(): Promise<void> {
  const res = await apiClient.post(`/auth/logout`);
  unwrapApi(res);
}

export async function loginWithPassword(body: { email: string; password: string }): Promise<{
  accessToken: string;
  user: AuthUser;
}> {
  const res = await apiClient.post("/auth/login", body);
  return unwrapApi(res) as { accessToken: string; user: AuthUser };
}

export async function registerWithPassword(body: {
  email: string;
  password: string;
  name?: string;
}): Promise<{ accessToken: string; user: AuthUser }> {
  const res = await apiClient.post("/auth/register", body);
  return unwrapApi(res) as { accessToken: string; user: AuthUser };
}
