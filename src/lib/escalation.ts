// 5-stage diplomatic escalation state machine + WhatsApp template copy.
// Pure / client-safe (used by dashboard previews and server dispatcher).

import type { Invoice, InvoiceStatus, ReminderTier, ScheduledReminder } from "@/types/wasool";
import { addDays, daysOverdue, formatDateIN, formatINR } from "./dates";

export interface TemplateContext {
  clientName: string;
  brandName: string;
  invoiceNumber: string;
  amountPending: number;
  dueDate: string; // YYYY-MM-DD
}

export interface EscalationStage {
  tier: ReminderTier;
  offsetDays: number;
  templateName: string;
  label: string;
  tone: string;
  /** Meta template body with positional {{n}} placeholders. */
  body: string;
  /** Builds the ordered body parameters for this template. */
  params: (ctx: TemplateContext) => string[];
}

const amt = (n: number) => formatINR(n);
const due = (d: string) => formatDateIN(d);

/**
 * Templates for T-2, T+3 and T+7 are verbatim from the blueprint (§6.1).
 * T0 (ar_due_today) and T+15 (ar_suspension_notice) follow the same diplomatic
 * tone and must be submitted to Meta Business Manager for utility approval.
 */
export const ESCALATION_STAGES: EscalationStage[] = [
  {
    tier: "T_MINUS_2_COURTESY",
    offsetDays: -2,
    templateName: "ar_courtesy_ping",
    label: "T-2 Courtesy",
    tone: "Gentle heads-up",
    body:
      "Hi {{1}}, greetings from {{2}}. This is a gentle reminder that Invoice #{{3}} for ₹{{4}} is scheduled for due date {{5}}. You can complete the transfer seamlessly via 1-tap UPI below.",
    params: (c) => [c.clientName, c.brandName, c.invoiceNumber, amt(c.amountPending), due(c.dueDate)],
  },
  {
    tier: "T_ZERO_DUE_DATE",
    offsetDays: 0,
    templateName: "ar_due_today",
    label: "T0 Due Today",
    tone: "Friendly nudge",
    body:
      "Hi {{1}}, this is the accounts desk at {{2}}. Invoice #{{3}} for ₹{{4}} is due today ({{5}}). Tap below to settle instantly via UPI — it takes under 10 seconds.",
    params: (c) => [c.clientName, c.brandName, c.invoiceNumber, amt(c.amountPending), due(c.dueDate)],
  },
  {
    tier: "T_PLUS_3_RECONCILIATION",
    offsetDays: 3,
    templateName: "ar_audit_reconciliation",
    label: "T+3 Reconciliation",
    tone: "Audit framing",
    body:
      "Hi {{1}}, our accounts team at {{2}} is reconciling monthly ledgers. We haven't recorded the settlement of ₹{{3}} for Invoice #{{4}} (Due: {{5}}). If already paid, please reply with the UTR number, or settle instantly via UPI below.",
    params: (c) => [c.clientName, c.brandName, amt(c.amountPending), c.invoiceNumber, due(c.dueDate)],
  },
  {
    tier: "T_PLUS_7_FORMAL_NOTICE",
    offsetDays: 7,
    templateName: "ar_overdue_escalation",
    label: "T+7 Formal Notice",
    tone: "Firm, polite",
    body:
      "Dear {{1}}, Invoice #{{2}} for ₹{{3}} from {{4}} is now 7 days overdue. To avoid an automated hold on ongoing deliverables/account credit, please clear the balance today using the instant UPI link below.",
    params: (c) => [c.clientName, c.invoiceNumber, amt(c.amountPending), c.brandName],
  },
  {
    tier: "T_PLUS_15_SUSPENSION_ALERT",
    offsetDays: 15,
    templateName: "ar_suspension_notice",
    label: "T+15 Suspension Alert",
    tone: "Final notice",
    body:
      "Dear {{1}}, Invoice #{{2}} for ₹{{3}} from {{4}} is now 15 days overdue (Due: {{5}}). As per our credit terms, ongoing services and account credit may be placed on hold until the balance is cleared. Please settle today via the UPI link below, or reply with the UTR if already paid.",
    params: (c) => [c.clientName, c.invoiceNumber, amt(c.amountPending), c.brandName, due(c.dueDate)],
  },
];

export const STAGE_BY_TIER: Record<ReminderTier, EscalationStage> = Object.fromEntries(
  ESCALATION_STAGES.map((s) => [s.tier, s]),
) as Record<ReminderTier, EscalationStage>;

export const COLLECTIBLE_STATUSES: InvoiceStatus[] = ["PENDING", "PARTIALLY_PAID"];

export function isCollectible(inv: Pick<Invoice, "status">): boolean {
  return COLLECTIBLE_STATUSES.includes(inv.status);
}

/** Fills {{n}} placeholders — used for previews and dry-run logs. */
export function renderTemplate(stage: EscalationStage, ctx: TemplateContext): string {
  const values = stage.params(ctx);
  return stage.body.replace(/\{\{(\d+)\}\}/g, (_, n) => values[Number(n) - 1] ?? "");
}

/**
 * Computes the reminder queue for an invoice.
 * - Future stages are queued on their natural date.
 * - If the invoice is imported late, the most recent missed stage is queued
 *   for today (once) so late imports still receive the right-tone message,
 *   instead of replaying every earlier stage.
 */
export function computeSchedule(dueDate: string, today: string): ScheduledReminder[] {
  const all = ESCALATION_STAGES.map((s) => ({ tier: s.tier, scheduled_for: addDays(dueDate, s.offsetDays) }));
  const upcoming = all.filter((r) => r.scheduled_for >= today);
  const missed = all.filter((r) => r.scheduled_for < today);
  const hasToday = upcoming.some((r) => r.scheduled_for === today);
  if (missed.length > 0 && !hasToday) {
    upcoming.unshift({ tier: missed[missed.length - 1].tier, scheduled_for: today });
  }
  return upcoming;
}

/** Stage appropriate for an invoice's current age (for manual "send now"). */
export function stageForToday(dueDate: string, today: string): EscalationStage {
  const d = daysOverdue(dueDate, today);
  let chosen = ESCALATION_STAGES[0];
  for (const s of ESCALATION_STAGES) if (d >= s.offsetDays) chosen = s;
  return chosen;
}

// ---- Aging buckets (dashboard) -------------------------------------------

export type AgingBucket = "DUE_SOON" | "OVERDUE_1_7" | "OVERDUE_8_14" | "OVERDUE_15_PLUS" | "RECOVERED" | "CLOSED";

export const BUCKET_LABELS: Record<AgingBucket, string> = {
  DUE_SOON: "Due Soon",
  OVERDUE_1_7: "1–7 Days Overdue",
  OVERDUE_8_14: "8–14 Days Overdue",
  OVERDUE_15_PLUS: "15+ Days Overdue",
  RECOVERED: "Recovered (Paid)",
  CLOSED: "Disputed / Cancelled",
};

export function agingBucket(inv: Pick<Invoice, "status" | "due_date">, today: string): AgingBucket {
  if (inv.status === "PAID") return "RECOVERED";
  if (!isCollectible(inv)) return "CLOSED";
  const d = daysOverdue(inv.due_date, today);
  if (d <= 0) return "DUE_SOON";
  if (d <= 7) return "OVERDUE_1_7";
  if (d <= 14) return "OVERDUE_8_14";
  return "OVERDUE_15_PLUS";
}
