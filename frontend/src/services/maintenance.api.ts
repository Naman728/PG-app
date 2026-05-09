import type {
  AddMaintenanceMessageInput,
  CreateMaintenanceTicketInput,
  ListMaintenanceTicketsQuery,
  MaintenanceMetricsQuery,
  MaintenanceTicketStatusBody,
  PatchMaintenanceTicketInput,
  SubmitMaintenanceRatingInput,
} from "@pg-manager/shared";
import { apiClient, unwrapApi } from "../lib/api-client";

export async function fetchMaintenanceStaff(organizationId: string) {
  const res = await apiClient.get(`/owner/organizations/${organizationId}/maintenance/staff`);
  return unwrapApi(res) as {
    staff: Array<{
      userId: string;
      orgRole: string;
      user: { id: string; name: string | null; phone: string };
    }>;
  };
}

export async function fetchMaintenanceTickets(
  organizationId: string,
  query: ListMaintenanceTicketsQuery,
) {
  const res = await apiClient.get(`/owner/organizations/${organizationId}/maintenance/tickets`, {
    params: query,
  });
  return unwrapApi(res) as {
    items: unknown[];
    total: number;
    page: number;
    pageSize: number;
  };
}

export async function fetchMaintenanceMetrics(
  organizationId: string,
  query: MaintenanceMetricsQuery,
) {
  const res = await apiClient.get(`/owner/organizations/${organizationId}/maintenance/metrics`, {
    params: query,
  });
  return unwrapApi(res) as {
    resolvedCount: number;
    avgResolutionHours: number | null;
    avgCostMinor: number | null;
    avgRating: number | null;
    byCategory: Record<string, number>;
  };
}

export async function fetchMaintenanceTicket(organizationId: string, ticketId: string) {
  const res = await apiClient.get(
    `/owner/organizations/${organizationId}/maintenance/tickets/${ticketId}`,
  );
  return unwrapApi(res) as { ticket: Record<string, unknown> };
}

export async function fetchMaintenanceTimeline(organizationId: string, ticketId: string) {
  const res = await apiClient.get(
    `/owner/organizations/${organizationId}/maintenance/tickets/${ticketId}/timeline`,
  );
  return unwrapApi(res) as {
    entries: Array<{
      kind: "activity" | "message";
      createdAt: string;
      data: Record<string, unknown>;
    }>;
  };
}

export async function patchMaintenanceTicket(
  organizationId: string,
  ticketId: string,
  body: PatchMaintenanceTicketInput,
) {
  const res = await apiClient.patch(
    `/owner/organizations/${organizationId}/maintenance/tickets/${ticketId}`,
    body,
  );
  return unwrapApi(res) as { ticket: Record<string, unknown> };
}

export async function postMaintenanceStatus(
  organizationId: string,
  ticketId: string,
  body: MaintenanceTicketStatusBody,
) {
  const res = await apiClient.post(
    `/owner/organizations/${organizationId}/maintenance/tickets/${ticketId}/status`,
    body,
  );
  return unwrapApi(res) as { ticket: Record<string, unknown> };
}

export async function postMaintenanceMessage(
  organizationId: string,
  ticketId: string,
  body: AddMaintenanceMessageInput,
) {
  const res = await apiClient.post(
    `/owner/organizations/${organizationId}/maintenance/tickets/${ticketId}/messages`,
    body,
  );
  return unwrapApi(res) as { id: string };
}

export async function postMaintenanceAttachment(organizationId: string, ticketId: string, file: File) {
  const fd = new FormData();
  fd.append("file", file);
  const res = await apiClient.post(
    `/owner/organizations/${organizationId}/maintenance/tickets/${ticketId}/attachments`,
    fd,
  );
  return unwrapApi(res) as { id: string; publicId: string };
}

export async function fetchMaintenanceAttachmentUrl(
  organizationId: string,
  ticketId: string,
  attachmentId: string,
) {
  const res = await apiClient.get(
    `/owner/organizations/${organizationId}/maintenance/tickets/${ticketId}/attachments/${attachmentId}/signed-url`,
  );
  return unwrapApi(res) as { url: string };
}

export async function createTenantMaintenanceTicket(body: CreateMaintenanceTicketInput) {
  const res = await apiClient.post("/tenant/me/maintenance/tickets", body);
  return unwrapApi(res) as { id: string };
}

export async function listTenantMaintenanceTickets(page = 1, pageSize = 25) {
  const res = await apiClient.get("/tenant/me/maintenance/tickets", { params: { page, pageSize } });
  return unwrapApi(res) as {
    items: Array<Record<string, unknown>>;
    total: number;
    page: number;
    pageSize: number;
  };
}

export async function fetchTenantMaintenanceTicket(ticketId: string) {
  const res = await apiClient.get(`/tenant/me/maintenance/tickets/${ticketId}`);
  return unwrapApi(res) as { ticket: Record<string, unknown> };
}

export async function fetchTenantMaintenanceTimeline(ticketId: string) {
  const res = await apiClient.get(`/tenant/me/maintenance/tickets/${ticketId}/timeline`);
  return unwrapApi(res) as {
    entries: Array<{ kind: "activity" | "message"; createdAt: string; data: Record<string, unknown> }>;
  };
}

export async function postTenantMaintenanceMessage(ticketId: string, body: AddMaintenanceMessageInput) {
  const res = await apiClient.post(`/tenant/me/maintenance/tickets/${ticketId}/messages`, body);
  return unwrapApi(res) as { id: string };
}

export async function postTenantMaintenanceAttachment(ticketId: string, file: File) {
  const fd = new FormData();
  fd.append("file", file);
  const res = await apiClient.post(`/tenant/me/maintenance/tickets/${ticketId}/attachments`, fd);
  return unwrapApi(res) as { id: string };
}

export async function postTenantMaintenanceRating(ticketId: string, body: SubmitMaintenanceRatingInput) {
  const res = await apiClient.post(`/tenant/me/maintenance/tickets/${ticketId}/rate`, body);
  return unwrapApi(res) as { ok: boolean };
}

export async function fetchTenantMaintenanceAttachmentUrl(ticketId: string, attachmentId: string) {
  const res = await apiClient.get(
    `/tenant/me/maintenance/tickets/${ticketId}/attachments/${attachmentId}/signed-url`,
  );
  return unwrapApi(res) as { url: string };
}
