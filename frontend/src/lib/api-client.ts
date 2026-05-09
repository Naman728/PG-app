import axios, { AxiosError, type AxiosResponse } from "axios";
import type { ApiErrorBody, ApiResponse } from "@pg-manager/shared";
import { API_BASE_URL } from "../constants/config";
import { useAuthStore } from "../store/auth.store";
import { formatApiErrorDetails } from "./api-error";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  /** Avoid an infinite spinner in AppProviders when the API is unreachable. */
  timeout: 12_000,
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (res) => res,
  (err: AxiosError<ApiResponse<unknown>>) => {
    const data = err.response?.data;
    if (
      data &&
      typeof data === "object" &&
      "success" in data &&
      data.success === false
    ) {
      const body = data as ApiErrorBody;
      const details = formatApiErrorDetails(body.error.details);
      let message = `${body.error.message}${details}`.trim();
      if (err.response?.status === 403) {
        message = `${message} If this is unexpected, you may need OWNER or MANAGER access for this PG.`;
      }
      return Promise.reject(new Error(message));
    }
    const st = err.response?.status;
    return Promise.reject(
      new Error(
        st
          ? `Request failed (HTTP ${st}). ${err.message || "Check that the API is running and you are signed in."}`.trim()
          : err.message || "Network error. Is the API running?",
      ),
    );
  },
);

export function unwrapApi<T>(res: AxiosResponse<ApiResponse<T>>): T {
  const body = res.data;
  if (!body.success) {
    const message = "error" in body ? body.error.message : "Request failed";
    throw new Error(message);
  }
  return body.data;
}
