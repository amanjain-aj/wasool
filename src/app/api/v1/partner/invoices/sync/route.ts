// POST /api/v1/partner/invoices/sync — Blueprint §5.1
import { NextRequest, NextResponse } from "next/server";
import type { PartnerSyncPayload } from "@/types/wasool";
import { authenticatePartner } from "@/lib/partner-auth";
import { errorResponse, HttpError, readJson } from "@/lib/http";
import { getStore } from "@/lib/store";
import { ingestInvoice } from "@/lib/services";
import { isValidVPA, normalizeIndianPhone } from "@/lib/upi";
import { todayIST } from "@/lib/dates";

export async function POST(req: NextRequest) {
  try {
    const body = await readJson<PartnerSyncPayload>(req);
    await authenticatePartner(req, body?.partner_id);

    const { partner_id, merchant, debtor, invoice } = body ?? ({} as PartnerSyncPayload);
    if (!partner_id || !merchant?.id || !merchant.business_name || !debtor || !invoice) {
      throw new HttpError(422, "partner_id, merchant{id,business_name,upi_vpa}, debtor and invoice are required");
    }
    if (!merchant.upi_vpa || !isValidVPA(merchant.upi_vpa)) {
      throw new HttpError(422, `merchant.upi_vpa "${merchant.upi_vpa ?? ""}" is not a valid UPI VPA`);
    }

    const store = getStore();

    // 1. Upsert merchant tenant (match on partner identity first, then owner_email as in the blueprint)
    const tenantFields = {
      type: "INTEGRATION_PARTNER" as const,
      partner_id,
      partner_merchant_id: merchant.id,
      business_name: merchant.business_name,
      brand_display_name: merchant.business_name,
      owner_phone: normalizeIndianPhone(merchant.phone) ?? merchant.phone ?? "",
      owner_email: merchant.email || `${merchant.id}@${partner_id}.partner`,
      upi_vpa: merchant.upi_vpa.trim(),
      plan_tier: "partner_embedded",
      ...(merchant.gstin ? { gstin: merchant.gstin.toUpperCase() } : {}),
    };
    const existing = await store.findTenantByPartner(partner_id, merchant.id);
    const tenant = existing
      ? await store.updateTenant(existing.id, tenantFields)
      : await store.upsertTenant(tenantFields);

    // 2–4. Upsert debtor, generate UPI intent, upsert invoice, schedule escalation
    const result = await ingestInvoice({
      tenant,
      debtor: { client_name: debtor.name, phone: debtor.phone, contact_person: debtor.contact_person, email: debtor.email },
      invoice: {
        invoice_number: invoice.number,
        external_invoice_id: invoice.external_id ?? null,
        amount_total_inr: Number(invoice.amount_total ?? invoice.amount_pending),
        amount_pending_inr: Number(invoice.amount_pending),
        issue_date: invoice.issue_date ?? todayIST(),
        due_date: invoice.due_date,
        autopilot_enabled: true,
      },
    });

    return NextResponse.json(
      {
        status: result.scheduled.length ? "scheduled" : "synced",
        invoice_id: result.invoice.id,
        invoice_status: result.invoice.status,
        upi_intent_url: result.invoice.payment_link_url,
        reminders: result.scheduled,
      },
      { status: 201 },
    );
  } catch (err) {
    return errorResponse(err);
  }
}
