import type {
  BulkRemindRentInput,
  ConfirmRentPaymentInput,
  ListRentInvoicesQuery,
  UpdateRentReminderSettingsInput,
} from "@pg-manager/shared";
import { apiClient, unwrapApi } from "../lib/api-client";

export type RentDashboard = {
  billingYear: number;
  billingMonth: number;
  counts: { total: number; due: number; overdue: number; paid: number };
  expectedMinor: number;
  collectedMinor: number;
  outstandingMinor: number;
  collectionRate: number;
};

export type RentInvoiceRow = {
  id: string;
  billingYear: number;
  billingMonth: number;
  amountMinor: number;
  currency: string;
  dueDate: string;
  status: string;
  paidAt: string | null;
  paidAmountMinor: number | null;
  paymentMethod: string | null;
  receiptNumber: string | null;
  tenant: { id: string; name: string | null; phone: string };
  organization?: { id: string; name: string; city: string };
  bed: {
    id: string;
    label: string;
    room: { name: string; floor: { name: string } };
  };
};

export async function fetchRentDashboard(
  organizationId: string,
  billingYear: number,
  billingMonth: number,
) {
  const res = await apiClient.get(`/owner/organizations/${organizationId}/rent/dashboard`, {
    params: { billingYear, billingMonth },
  });
  return unwrapApi(res) as RentDashboard;
}

export async function fetchRentInvoices(
  organizationId: string,
  query: ListRentInvoicesQuery,
) {
  const res = await apiClient.get(`/owner/organizations/${organizationId}/rent/invoices`, {
    params: query,
  });
  return unwrapApi(res) as {
    items: RentInvoiceRow[];
    total: number;
    page: number;
    pageSize: number;
  };
}

export async function fetchRentSettings(organizationId: string) {
  const res = await apiClient.get(`/owner/organizations/${organizationId}/rent/settings`);
  return unwrapApi(res) as {
    settings: {
      dueDayOfMonth: number;
      remindDaysBefore: number;
      overdueRepeatDays: number;
      whatsappEnabled: boolean;
      smsFallbackEnabled: boolean;
      ownerOverdueDigestEnabled: boolean;
    };
  };
}

export async function patchRentSettings(
  organizationId: string,
  body: UpdateRentReminderSettingsInput,
) {
  const res = await apiClient.patch(`/owner/organizations/${organizationId}/rent/settings`, body);
  return unwrapApi(res) as Awaited<ReturnType<typeof fetchRentSettings>>;
}

export async function confirmRentPaymentApi(
  organizationId: string,
  invoiceId: string,
  body: ConfirmRentPaymentInput,
) {
  const res = await apiClient.post(
    `/owner/organizations/${organizationId}/rent/invoices/${invoiceId}/confirm-payment`,
    body,
  );
  return unwrapApi(res) as { invoice: RentInvoiceRow };
}

export async function bulkRemindRentApi(organizationId: string, body: BulkRemindRentInput) {
  const res = await apiClient.post(
    `/owner/organizations/${organizationId}/rent/invoices/bulk-remind`,
    body,
  );
  return unwrapApi(res) as { enqueued: number };
}

export async function generateRentMonthApi(
  organizationId: string,
  billingYear: number,
  billingMonth: number,
) {
  const res = await apiClient.post(
    `/owner/organizations/${organizationId}/rent/actions/generate-month`,
    null,
    { params: { billingYear, billingMonth } },
  );
  return unwrapApi(res) as { created: number; skipped: number };
}

export async function fetchRentNotifications(organizationId: string, page: number) {
  const res = await apiClient.get(`/owner/organizations/${organizationId}/rent/notifications`, {
    params: { page, pageSize: 15 },
  });
  return unwrapApi(res) as {
    items: Array<{
      id: string;
      type: string;
      status: string;
      attemptCount: number;
      maxAttempts: number;
      lastError: string | null;
      createdAt: string;
      processedAt: string | null;
      deliveries: Array<{
        channel: string;
        success: boolean;
        toPhone: string;
        providerSid: string | null;
        errorMessage: string | null;
        createdAt: string;
      }>;
    }>;
    total: number;
    page: number;
    pageSize: number;
  };
}

export async function downloadRentExcel(organizationId: string, query: ListRentInvoicesQuery) {
  const res = await apiClient.get(`/owner/organizations/${organizationId}/rent/export.xlsx`, {
    params: query,
    responseType: "blob",
  });
  const blob = res.data as Blob;
  if (blob.type && blob.type.includes("json")) {
    const text = await blob.text();
    try {
      const j = JSON.parse(text) as { error?: { message?: string } };
      throw new Error(j.error?.message ?? "Export failed");
    } catch {
      throw new Error("Export failed");
    }
  }
  return blob;
}

export async function fetchRentReceiptBlob(organizationId: string, invoiceId: string) {
  const res = await apiClient.get(
    `/owner/organizations/${organizationId}/rent/invoices/${invoiceId}/receipt.pdf`,
    { responseType: "blob" },
  );
  return res.data as Blob;
}

export async function fetchTenantRentInvoices() {
  const res = await apiClient.get("/tenant/me/rent/invoices");
  return unwrapApi(res) as { items: RentInvoiceRow[] };
}
