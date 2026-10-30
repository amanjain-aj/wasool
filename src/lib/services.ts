import "server-only";
import type { CsvInvoiceRow, Debtor, Invoice, ScheduledReminder, Tenant } from "@/types/wasool";
import { getStore } from "./store";
import { HttpError } from "./http";
import { buildUPILink, normalizeIndianPhone } from "./upi";
import { computeSchedule, isCollectible } from "./escalation";
import { isISODate, parseFlexibleDate, round2, todayIST } from "./dates";

export interface IngestInput {
  tenant: Tenant;
  debtor: { client_name: string; phone: string; contact_person?: string | null; email?: string | null };
  invoice: {
    invoice_number: string;
    external_invoice_id?: string | null;
    amount_total_inr: number;
    amount_pending_inr: number;
    issue_date: string;
    due_date: string;
    autopilot_enabled?: boolean;
  };
}

export interface IngestResult {
  invoice: Invoice;
  debtor: Debtor;
  scheduled: ScheduledReminder[];
}

function validateIngest(input: IngestInput) {
  const { debtor, invoice } = input;
  const problems: string[] = [];
  if (!debtor.client_name?.trim()) problems.push("debtor name is required");
  if (!normalizeIndianPhone(debtor.phone)) problems.push(`invalid Indian mobile number "${debtor.phone}"`);
  if (!invoice.invoice_number?.trim()) problems.push("invoice number is required");
  if (!Number.isFinite(invoice.amount_pending_inr) || invoice.amount_pending_inr <= 0)
    problems.push("amount_pending must be a positive number");
  if (!Number.isFinite(invoice.amount_total_inr) || invoice.amount_total_inr < invoice.amount_pending_inr)
    problems.push("amount_total must be >= amount_pending");
  if (!isISODate(invoice.due_date)) problems.push("due_date must be YYYY-MM-DD");
  if (!isISODate(invoice.issue_date)) problems.push("issue_date must be YYYY-MM-DD");
  if (problems.length) throw new HttpError(422, problems.join("; "));
}

/** Single ingestion path for Partner API, CSV import and manual entry. */
export async function ingestInvoice(input: IngestInput): Promise<IngestResult> {
  validateIngest(input);
  const store = getStore();
  const { tenant } = input;

  const debtor = await store.upsertDebtor({
    tenant_id: tenant.id,
    client_name: input.debtor.client_name.trim(),
    phone: normalizeIndianPhone(input.debtor.phone)!,
    contact_person: input.debtor.contact_person ?? undefined,
    email: input.debtor.email ?? undefined,
  });

  const amountPending = round2(input.invoice.amount_pending_inr);
  const upiLink = buildUPILink(tenant.upi_vpa, tenant.brand_display_name, amountPending, input.invoice.invoice_number);

  const invoice = await store.upsertInvoice({
    tenant_id: tenant.id,
    debtor_id: debtor.id,
    external_invoice_id: input.invoice.external_invoice_id ?? null,
    invoice_number: input.invoice.invoice_number.trim(),
    amount_total_inr: round2(input.invoice.amount_total_inr),
    amount_pending_inr: amountPending,
    issue_date: input.invoice.issue_date,
    due_date: input.invoice.due_date,
    payment_link_url: upiLink,
    autopilot_enabled: input.invoice.autopilot_enabled,
  });

  const scheduled = await rescheduleInvoice(invoice);
  return { invoice, debtor, scheduled };
}

/** Rebuilds the QUEUED reminder queue (or clears it if not collectible / autopilot off). */
export async function rescheduleInvoice(invoice: Invoice): Promise<ScheduledReminder[]> {
  const store = getStore();
  if (!isCollectible(invoice) || !invoice.autopilot_enabled) {
    await store.deleteQueuedDispatches(invoice.id);
    return [];
  }
  const schedule = computeSchedule(invoice.due_date, todayIST());
  await store.replaceQueuedDispatches(invoice.id, schedule);
  return schedule;
}

export interface SettleResult {
  invoice: Invoice;
  status: "PAID" | "PARTIALLY_PAID" | "ALREADY_PAID";
  cancelled_reminders: number;
}

/**
 * Records a payment. Full payment -> PAID + QUEUED reminders deleted.
 * Partial payment -> PARTIALLY_PAID, pending reduced, UPI link regenerated for
 * the balance, reminders keep running.
 */
export async function settleInvoice(
  invoiceId: string,
  opts: { utr_reference?: string | null; amount_paid?: number | null },
): Promise<SettleResult> {
  const store = getStore();
  const inv = await store.getInvoice(invoiceId);
  if (!inv) throw new HttpError(404, "Invoice not found");
  if (inv.status === "PAID") return { invoice: inv, status: "ALREADY_PAID", cancelled_reminders: 0 };
  if (inv.status === "CANCELLED") throw new HttpError(409, "Invoice is cancelled");

  const utr = opts.utr_reference?.trim() || null;
  const paid = opts.amount_paid == null ? inv.amount_pending_inr : Number(opts.amount_paid);
  if (!Number.isFinite(paid) || paid <= 0) throw new HttpError(422, "amount_paid must be a positive number");

  const remaining = round2(inv.amount_pending_inr - paid);
  if (remaining > 0) {
    const updated = await store.updateInvoice(inv.id, {
      status: "PARTIALLY_PAID",
      amount_pending_inr: remaining,
      utr_reference: utr ?? inv.utr_reference,
      payment_link_url: buildUPILink(inv.tenant.upi_vpa, inv.tenant.brand_display_name, remaining, inv.invoice_number),
    });
    return { invoice: updated, status: "PARTIALLY_PAID", cancelled_reminders: 0 };
  }

  const updated = await store.updateInvoice(inv.id, {
    status: "PAID",
    amount_pending_inr: 0,
    utr_reference: utr ?? inv.utr_reference,
  });
  const cancelled = await store.deleteQueuedDispatches(inv.id);
  return { invoice: updated, status: "PAID", cancelled_reminders: cancelled };
}

// ---- CSV rows ----------------------------------------------------------------

const toNumber = (v: unknown) => {
  if (typeof v === "number") return v;
  if (typeof v === "string" && v.trim()) return Number(v.replace(/[₹,\s]/g, ""));
  return NaN;
};

export function csvRowToIngest(tenant: Tenant, row: CsvInvoiceRow): IngestInput {
  const total = toNumber(row.amount_total);
  const pendingRaw = toNumber(row.amount_pending);
  const due = parseFlexibleDate(row.due_date);
  const issue = row.issue_date ? parseFlexibleDate(row.issue_date) : todayIST();
  return {
    tenant,
    debtor: {
      client_name: String(row.client_name ?? ""),
      phone: String(row.phone ?? ""),
      contact_person: row.contact_person ? String(row.contact_person) : null,
      email: row.email ? String(row.email) : null,
    },
    invoice: {
      invoice_number: String(row.invoice_number ?? ""),
      amount_total_inr: total,
      amount_pending_inr: Number.isFinite(pendingRaw) ? pendingRaw : total,
      issue_date: issue ?? String(row.issue_date),
      due_date: due ?? String(row.due_date),
    },
  };
}
