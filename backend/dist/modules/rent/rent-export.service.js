import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import { finished } from "node:stream/promises";
import { prisma } from "../../prisma/client.js";
function formatInr(minor) {
    return (minor / 100).toLocaleString("en-IN", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    });
}
export async function buildRentInvoicesWorkbook(params) {
    const rows = await prisma.rentInvoice.findMany({
        where: { organizationId: params.organizationId, ...params.where },
        orderBy: [{ billingYear: "desc" }, { billingMonth: "desc" }, { dueDate: "asc" }],
        include: {
            tenant: { select: { name: true, phone: true } },
            bed: {
                select: {
                    label: true,
                    room: { select: { name: true, floor: { select: { name: true } } } },
                },
            },
        },
    });
    const wb = new ExcelJS.Workbook();
    wb.creator = "PG Manager";
    const sheet = wb.addWorksheet("Rent invoices");
    sheet.columns = [
        { header: "Period", key: "period", width: 12 },
        { header: "Tenant", key: "tenant", width: 22 },
        { header: "Phone", key: "phone", width: 16 },
        { header: "Room / bed", key: "loc", width: 28 },
        { header: "Amount (₹)", key: "amount", width: 14 },
        { header: "Due", key: "due", width: 14 },
        { header: "Status", key: "status", width: 12 },
        { header: "Paid at", key: "paidAt", width: 18 },
    ];
    sheet.getRow(1).font = { bold: true };
    for (const r of rows) {
        const floor = r.bed.room.floor.name;
        const room = r.bed.room.name;
        sheet.addRow({
            period: `${r.billingYear}-${String(r.billingMonth).padStart(2, "0")}`,
            tenant: r.tenant.name ?? "",
            phone: r.tenant.phone,
            loc: `${floor} / ${room} / ${r.bed.label}`,
            amount: formatInr(r.amountMinor),
            due: r.dueDate.toISOString().slice(0, 10),
            status: r.status,
            paidAt: r.paidAt ? r.paidAt.toISOString() : "",
        });
    }
    const buf = await wb.xlsx.writeBuffer();
    return Buffer.from(buf);
}
export async function buildRentReceiptPdf(params) {
    const doc = new PDFDocument({ size: "A4", margin: 48 });
    const chunks = [];
    doc.on("data", (c) => chunks.push(c));
    doc.fontSize(20).text("Rent receipt", { align: "center" });
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor("#444").text(params.organizationName, { align: "center" });
    doc.fontSize(9).text(params.orgAddress, { align: "center" });
    doc.moveDown(1.2);
    doc.fillColor("#111");
    doc.fontSize(11).text(`Receipt no: ${params.receiptNumber ?? "—"}`);
    doc.text(`Date: ${params.paidAt.toLocaleDateString("en-IN", { dateStyle: "long" })}`);
    doc.moveDown();
    doc.fontSize(12).text("Received from");
    doc.fontSize(11).text(params.tenantName);
    doc.fontSize(10).fillColor("#555").text(params.tenantPhone);
    doc.fillColor("#111");
    doc.moveDown();
    doc.fontSize(12).text("Property / unit");
    doc.fontSize(11).text(params.locationLabel);
    doc.moveDown();
    doc.fontSize(12).text("Billing period");
    doc.fontSize(11).text(params.billingLabel);
    doc.moveDown();
    doc.fontSize(12).text("Amount received");
    doc.fontSize(14).text(`₹ ${formatInr(params.amountMinor)}`, { continued: false });
    doc.moveDown(0.3);
    doc.fontSize(10).fillColor("#555").text(`Mode: ${params.paymentMethod ?? "—"}`);
    doc.fillColor("#111");
    doc.moveDown(1.5);
    doc.fontSize(9).fillColor("#666").text("This is a computer-generated receipt.", {
        align: "center",
    });
    doc.end();
    await finished(doc);
    return Buffer.concat(chunks);
}
//# sourceMappingURL=rent-export.service.js.map