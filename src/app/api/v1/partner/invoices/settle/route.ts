// POST /api/v1/partner/invoices/settle — Blueprint §5.2
// Marks status = 'PAID' (or PARTIALLY_PAID), records utr_reference, deletes QUEUED reminders.
import { NextRequest, NextResponse } from "next/server";
import type { PartnerSettlePayload } from "@/types/wasool";
import { authenticatePartner } from "@/lib/partner-auth";
import { errorResponse, HttpError, readJson } from "@/lib/http";
import { getStore } from "@/lib/store";
import { settleInvoice } from "@/lib/services";

export async function POST(req: NextRequest) {
  try {
    const body = await readJson<PartnerSettlePayload>(req);
    await authenticatePartner(req, body?.partner_id);

    const { partner_id, merchant_id, invoice_number, external_invoice_id, utr_reference, amount_paid } = body ?? ({} as PartnerSettlePayload);
    if (!partner_id || !merchant_id || (!invoice_number && !external_invoice_id)) {
      throw new HttpError(422, "partner_id, merchant_id and invoice_number (or external_invoice_id) are required");
    }
    if (!utr_reference?.trim()) throw new HttpError(422, "utr_reference is required");

    const store = getStore();
    const tenant = await store.findTenantByPartner(partner_id, merchant_id);
    if (!tenant) throw new HttpError(404, `Merchant ${merchant_id} not found for partner ${partner_id}`);

    const invoice = await store.findInvoice(tenant.id, { invoice_number, external_invoice_id });
    if (!invoice) throw new HttpError(404, "Invoice not found");

    const result = await settleInvoice(invoice.id, { utr_reference, amount_paid });
    return NextResponse.json({
      status: result.status,
      invoice_id: result.invoice.id,
      amount_pending_inr: result.invoice.amount_pending_inr,
      utr_reference: result.invoice.utr_reference,
      cancelled_reminders: result.cancelled_reminders,
    });
  } catch (err) {
    return errorResponse(err);
  }
}
