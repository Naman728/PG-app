import type { Prisma } from "@prisma/client";
export declare function buildRentInvoicesWorkbook(params: {
    organizationId: string;
    where: Prisma.RentInvoiceWhereInput;
}): Promise<Buffer>;
export declare function buildRentReceiptPdf(params: {
    organizationName: string;
    orgAddress: string;
    tenantName: string;
    tenantPhone: string;
    receiptNumber: string | null;
    billingLabel: string;
    amountMinor: number;
    paidAt: Date;
    paymentMethod: string | null;
    locationLabel: string;
}): Promise<Buffer>;
