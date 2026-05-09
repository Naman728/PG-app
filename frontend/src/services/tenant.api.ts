import type {
  CreateEmergencyContactInput,
  UpdateEmergencyContactInput,
  UpdateTenantProfileInput,
} from "@pg-manager/shared";
import { apiClient, unwrapApi } from "../lib/api-client";

export type TenantProfileResponse = {
  tenant: {
    id: string;
    status: string;
    moveInAt: string | null;
    moveOutAt: string | null;
    aadhaarMasked: string | null;
    dateOfBirth: string | null;
    occupation: string | null;
    permanentAddress: string | null;
    kycSubmittedAt: string | null;
    onboardedAt: string | null;
    statusNote: string | null;
  };
  user: { id: string; name: string | null; phone: string; email: string | null };
  documents: Array<{
    id: string;
    category: string;
    reviewStatus: string;
    originalFilename: string;
    mimeType: string;
    byteSize: number;
    reviewNote: string | null;
    reviewedAt: string | null;
    createdAt: string;
  }>;
  emergencyContacts: Array<{
    id: string;
    name: string;
    phone: string;
    relation: string;
    isPrimary: boolean;
  }>;
  bedAssignment: {
    bedId: string;
    label: string;
    monthlyRentMinor: number;
    room: { id: string; name: string };
    floor: { id: string; name: string };
  } | null;
};

export async function fetchTenantProfile() {
  const res = await apiClient.get("/tenant/me/profile");
  return unwrapApi(res) as TenantProfileResponse;
}

export async function patchTenantProfile(body: UpdateTenantProfileInput) {
  const res = await apiClient.patch("/tenant/me/profile", body);
  return unwrapApi(res) as TenantProfileResponse;
}

export async function submitTenantKyc() {
  const res = await apiClient.post("/tenant/me/kyc/submit");
  return unwrapApi(res) as { ok: boolean; status: string; kycSubmittedAt: string };
}

export async function uploadTenantDocument(category: string, file: File) {
  const form = new FormData();
  form.append("file", file);
  form.append("category", category);
  const res = await apiClient.post("/tenant/me/documents", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return unwrapApi(res) as {
    id: string;
    category: string;
    reviewStatus: string;
    originalFilename: string;
    createdAt: string;
  };
}

export async function deleteTenantDocument(documentId: string) {
  const res = await apiClient.delete(`/tenant/me/documents/${documentId}`);
  return unwrapApi(res) as { ok: boolean };
}

export async function getTenantDocumentSignedUrl(documentId: string) {
  const res = await apiClient.get(`/tenant/me/documents/${documentId}/signed-url`);
  return unwrapApi(res) as { url: string; expiresInSec: number };
}

export async function fetchTenantEmergencyContacts() {
  const res = await apiClient.get("/tenant/me/emergency-contacts");
  return unwrapApi(res) as {
    contacts: Array<{
      id: string;
      name: string;
      phone: string;
      relation: string;
      isPrimary: boolean;
    }>;
  };
}

export async function createTenantEmergencyContact(body: CreateEmergencyContactInput) {
  const res = await apiClient.post("/tenant/me/emergency-contacts", body);
  return unwrapApi(res) as {
    id: string;
    name: string;
    phone: string;
    relation: string;
    isPrimary: boolean;
  };
}

export async function patchTenantEmergencyContact(
  contactId: string,
  body: UpdateEmergencyContactInput,
) {
  const res = await apiClient.patch(`/tenant/me/emergency-contacts/${contactId}`, body);
  return unwrapApi(res) as {
    id: string;
    name: string;
    phone: string;
    relation: string;
    isPrimary: boolean;
  };
}

export async function deleteTenantEmergencyContact(contactId: string) {
  const res = await apiClient.delete(`/tenant/me/emergency-contacts/${contactId}`);
  return unwrapApi(res) as { ok: boolean };
}

export async function fetchTenantHistory(page: number, pageSize: number) {
  const res = await apiClient.get("/tenant/me/history", {
    params: { page, pageSize },
  });
  return unwrapApi(res) as {
    items: Array<{
      id: string;
      eventType: string;
      payload: unknown;
      createdAt: string;
      createdBy: { id: string; name: string | null; phone: string } | null;
    }>;
    page: number;
    pageSize: number;
    total: number;
  };
}
