import axios, { AxiosError, type AxiosResponse } from "axios";
import type { ApiErrorBody, ApiResponse } from "@pg-manager/shared";
import { API_BASE_URL } from "../constants/config";
import { useAuthStore } from "../store/auth.store";
import { formatApiErrorDetails } from "./api-error";

/** Clear message when the browser never receives an HTTP response (wrong URL, CORS, server down, etc.). */
function describeConnectionFailure(err: AxiosError): string {
  const code = err.code;
  const base = (API_BASE_URL || "").trim();
  const isTimeout =
    code === "ECONNABORTED" ||
    (typeof err.message === "string" && err.message.toLowerCase().includes("timeout"));

  if (isTimeout) {
    return `Could not reach the API in time (${base || "no base URL"}). Check that the server is running and reachable.`;
  }

  let msg =
    typeof err.message === "string" && err.message.trim()
      ? err.message.trim()
      : code === "ERR_NETWORK"
        ? "Network error — the request did not reach the server."
        : "Could not connect to the API.";

  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    const usingLocalhostApi = /localhost|127\.0\.0\.1/i.test(base);
    if (usingLocalhostApi && host !== "localhost" && host !== "127.0.0.1") {
      msg += ` The app is calling "${base}" but you opened it from "${host}". Set VITE_API_URL to your real API URL at build time (e.g. Netlify Site configuration → Environment variables, or your CI env) and redeploy the frontend.`;
    } else if (!base) {
      msg +=
        " Set VITE_API_URL to your API base (e.g. https://api.example.com/api/v1) and rebuild.";
    }
  }

  if (!err.response) {
    msg +=
      " If the API is running, check CORS: backend FRONTEND_URL or CORS_ORIGINS must include this site’s origin (needed because cookies are sent with requests).";
  }

  return msg;
}

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
    if (st) {
      return Promise.reject(
        new Error(
          `Request failed (HTTP ${st}). ${err.message || "Check that the API is running and you are signed in."}`.trim(),
        ),
      );
    }
    return Promise.reject(new Error(describeConnectionFailure(err)));
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
