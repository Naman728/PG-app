import type { OwnerUpdateTenantInput, OwnerReviewDocumentInput } from "@pg-manager/shared";
import { apiClient, unwrapApi } from "../lib/api-client";

export type OwnerTenantListRow = {
  id: string;
  status: string;
  moveInAt: string | null;
  moveOutAt: string | null;
  kycSubmittedAt: string | null;
  onboardedAt: string | null;
  user: { id: string; name: string | null; phone: string; email: string | null };
  aadhaarMasked: string | null;
};

export async function listOwnerTenants(
  organizationId: string,
  params: { page?: number; pageSize?: number; status?: string; q?: string },
) {
  const res = await apiClient.get(`/owner/organizations/${organizationId}/tenants`, {
    params,
  });
  return unwrapApi(res) as {
    items: OwnerTenantListRow[];
    total: number;
    page: number;
    pageSize: number;
  };
}

export async function getOwnerTenantDetail(organizationId: string, tenantId: string) {
  const res = await apiClient.get(
    `/owner/organizations/${organizationId}/tenants/${tenantId}`,
  );
  return unwrapApi(res) as {
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
}

export async function patchOwnerTenant(
  organizationId: string,
  tenantId: string,
  body: OwnerUpdateTenantInput,
) {
  const res = await apiClient.patch(
    `/owner/organizations/${organizationId}/tenants/${tenantId}`,
    body,
  );
  return unwrapApi(res);
}

export async function getOwnerTenantHistory(
  organizationId: string,
  tenantId: string,
  page: number,
  pageSize: number,
) {
  const res = await apiClient.get(
    `/owner/organizations/${organizationId}/tenants/${tenantId}/history`,
    { params: { page, pageSize } },
  );
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

export async function getOwnerTenantDocumentSignedUrl(
  organizationId: string,
  documentId: string,
) {
  const res = await apiClient.get(
    `/owner/organizations/${organizationId}/tenants/documents/${documentId}/signed-url`,
  );
  return unwrapApi(res) as { url: string; expiresInSec: number };
}

export async function reviewOwnerTenantDocument(
  organizationId: string,
  documentId: string,
  body: OwnerReviewDocumentInput,
) {
  const res = await apiClient.patch(
    `/owner/organizations/${organizationId}/tenants/documents/${documentId}/review`,
    body,
  );
  return unwrapApi(res);
}
