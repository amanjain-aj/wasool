// POST /api/cron/daily-munshi-run (Runs 11:00 AM IST Daily)
import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import { todayIST, formatDateIN } from "@/lib/dates";
import { isWhatsAppLive, env } from "@/lib/config";
import { dispatchMunshiReminder } from "@/lib/whatsapp-dispatcher";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (env.cronSecret() && authHeader !== `Bearer ${env.cronSecret()}` && getStore().mode !== "local") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const store = getStore();
    const today = todayIST();
    const invoices = await store.listInvoices();
    let sent = 0;
    let skipped = 0;
    const results = [];

    for (const inv of invoices) {
      if (inv.status !== "PENDING" && inv.status !== "PARTIALLY_PAID") {
        continue;
      }

      if (!inv.autopilot_enabled) {
        skipped++;
        continue;
      }

      // Check if debtor is paused
      if (inv.debtor?.is_paused_until && inv.debtor.is_paused_until >= today) {
        skipped++;
        continue;
      }

      try {
        await dispatchMunshiReminder({
          recipientPhone: inv.debtor.phone,
          clientName: inv.debtor.contact_person || inv.debtor.client_name,
          businessName: inv.tenant.brand_display_name,
          invoiceNumber: inv.invoice_number,
          pendingAmount: inv.amount_pending_inr,
          dueDateFormatted: formatDateIN(inv.due_date),
          upiVpa: inv.tenant.upi_vpa,
          neftDetails: inv.tenant.bank_account_details || undefined,
          mediaStorageUrl: inv.media_storage_url,
          mediaMimeType: inv.media_mime_type
        });

        sent++;
        results.push({ invoice_number: inv.invoice_number, client: inv.debtor.client_name, status: "DISPATCHED" });
      } catch (err) {
        console.error(`[munshi-run] Failed for ${inv.invoice_number}:`, err);
        results.push({ invoice_number: inv.invoice_number, client: inv.debtor.client_name, status: "FAILED" });
      }
    }

    return NextResponse.json({
      ok: true,
      mode: isWhatsAppLive() ? "live" : "dry-run",
      run_date: today,
      sent,
      skipped,
      results
    });
  } catch (err) {
    console.error("[daily-munshi-run-err]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export const GET = POST;
