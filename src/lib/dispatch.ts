import "server-only";
import type { DispatchRunSummary, InvoiceWithRelations, ReminderDispatch } from "@/types/wasool";
import { getStore } from "./store";
import { dispatchWhatsAppTemplate } from "./whatsapp";
import { isWhatsAppLive } from "./config";
import { STAGE_BY_TIER, isCollectible, stageForToday, type EscalationStage } from "./escalation";
import { todayIST } from "./dates";
import { HttpError } from "./http";

async function sendStage(inv: InvoiceWithRelations, stage: EscalationStage) {
  return dispatchWhatsAppTemplate({
    recipientPhone: inv.debtor.phone,
    templateName: stage.templateName,
    bodyParams: stage.params({
      clientName: inv.debtor.contact_person || inv.debtor.client_name,
      brandName: inv.tenant.brand_display_name,
      invoiceNumber: inv.invoice_number,
      amountPending: inv.amount_pending_inr,
      dueDate: inv.due_date,
    }),
    buttonUrlSuffix: inv.id,
    phoneNumberId: inv.tenant.whatsapp_phone_number_id,
  });
}

/**
 * Daily 10:30 AM IST run (Upstash QStash). For each invoice with QUEUED
 * reminders due on/before `runDate`:
 *  - skip everything if the invoice is no longer collectible / autopilot off
 *    / tenant inactive,
 *  - otherwise send only the latest due stage (older backlog is SKIPPED so a
 *    debtor never receives several escalations at once).
 */
export async function runDailyDispatch(runDate: string = todayIST()): Promise<DispatchRunSummary> {
  const store = getStore();
  const due = await store.listDueDispatches(runDate);

  const byInvoice = new Map<string, ReminderDispatch[]>();
  for (const d of due) byInvoice.set(d.invoice_id, [...(byInvoice.get(d.invoice_id) ?? []), d]);

  const summary: DispatchRunSummary = {
    run_date: runDate,
    mode: isWhatsAppLive() ? "live" : "dry-run",
    evaluated: byInvoice.size,
    sent: 0,
    failed: 0,
    skipped: 0,
    results: [],
  };

  for (const [invoiceId, rows] of byInvoice) {
    rows.sort((a, b) => a.scheduled_for.localeCompare(b.scheduled_for) || STAGE_BY_TIER[a.tier].offsetDays - STAGE_BY_TIER[b.tier].offsetDays);
    const inv = await store.getInvoice(invoiceId);
    const now = new Date().toISOString();

    if (!inv || !isCollectible(inv) || !inv.autopilot_enabled || !inv.tenant?.is_active) {
      for (const r of rows) await store.updateDispatch(r.id, { delivery_status: "SKIPPED", dispatched_at: now });
      summary.skipped += rows.length;
      if (inv) {
        summary.results.push({
          invoice_id: inv.id,
          invoice_number: inv.invoice_number,
          client_name: inv.debtor.client_name,
          tier: rows[rows.length - 1].tier,
          status: "SKIPPED",
          error: !isCollectible(inv) ? `invoice ${inv.status}` : !inv.autopilot_enabled ? "autopilot off" : "tenant inactive",
        });
      }
      continue;
    }

    const latest = rows[rows.length - 1];
    for (const r of rows.slice(0, -1)) {
      await store.updateDispatch(r.id, { delivery_status: "SKIPPED", dispatched_at: now, error_message: `superseded by ${latest.tier}` });
      summary.skipped += 1;
    }

    try {
      const res = await sendStage(inv, STAGE_BY_TIER[latest.tier]);
      await store.updateDispatch(latest.id, {
        delivery_status: "SENT",
        dispatched_at: now,
        whatsapp_message_id: res.messageId,
        error_message: null,
      });
      summary.sent += 1;
      summary.results.push({
        invoice_id: inv.id,
        invoice_number: inv.invoice_number,
        client_name: inv.debtor.client_name,
        tier: latest.tier,
        status: "SENT",
        whatsapp_message_id: res.messageId,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await store.updateDispatch(latest.id, { delivery_status: "FAILED", dispatched_at: now, error_message: message.slice(0, 2000) });
      summary.failed += 1;
      summary.results.push({
        invoice_id: inv.id,
        invoice_number: inv.invoice_number,
        client_name: inv.debtor.client_name,
        tier: latest.tier,
        status: "FAILED",
        error: message,
      });
    }
  }

  return summary;
}

/** Dashboard "Trigger WhatsApp Now": sends the stage matching the invoice's current age. */
export async function sendReminderNow(invoiceId: string) {
  const store = getStore();
  const inv = await store.getInvoice(invoiceId);
  if (!inv) throw new HttpError(404, "Invoice not found");
  if (!isCollectible(inv)) throw new HttpError(409, `Invoice is ${inv.status}; reminders are halted`);

  const today = todayIST();
  const stage = stageForToday(inv.due_date, today);
  const now = new Date().toISOString();
  try {
    const res = await sendStage(inv, stage);
    const dispatch = await store.insertDispatch({
      invoice_id: inv.id,
      tier: stage.tier,
      scheduled_for: today,
      delivery_status: "SENT",
      dispatched_at: now,
      whatsapp_message_id: res.messageId,
    });
    return { dispatch, dry_run: res.dryRun, template: stage.templateName };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await store.insertDispatch({
      invoice_id: inv.id,
      tier: stage.tier,
      scheduled_for: today,
      delivery_status: "FAILED",
      dispatched_at: now,
      error_message: message.slice(0, 2000),
    });
    throw new HttpError(502, message);
  }
}
