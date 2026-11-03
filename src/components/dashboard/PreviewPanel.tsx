"use client";

import { useState } from "react";
import type { InvoiceWithRelations } from "@/types/wasool";
import { ESCALATION_STAGES, STAGE_BY_TIER, renderTemplate, stageForToday } from "@/lib/escalation";
import { formatDateIN } from "@/lib/dates";
import { WhatsAppBubble } from "../WhatsAppBubble";
import { UpiQr } from "../UpiQr";

const STATUS_STYLE: Record<string, string> = {
  QUEUED: "text-slate-400",
  SENT: "text-sky-400",
  DELIVERED: "text-sky-300",
  READ: "text-emerald-400",
  FAILED: "text-rose-400",
  SKIPPED: "text-slate-600",
};

export function PreviewPanel({ invoice, today }: { invoice: InvoiceWithRelations; today: string }) {
  const dispatchesList = Array.isArray(invoice.dispatches) ? invoice.dispatches : [];
  const nextQueued = dispatchesList.find((d) => d.delivery_status === "QUEUED");
  const defaultTier = nextQueued?.tier ?? stageForToday(invoice.due_date || today, today).tier;
  const [tier, setTier] = useState(defaultTier);
  const stage = STAGE_BY_TIER[tier] || ESCALATION_STAGES[0];
  const upi = invoice.payment_link_url ?? "";

  const text = renderTemplate(stage, {
    clientName: invoice.debtor?.contact_person || invoice.debtor?.client_name || "Client",
    brandName: invoice.tenant?.brand_display_name || "Wasool",
    invoiceNumber: invoice.invoice_number || "",
    amountPending: Number(invoice.amount_pending_inr) || 0,
    dueDate: invoice.due_date || today,
  });

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {ESCALATION_STAGES.map((s) => (
            <button
              key={s.tier}
              onClick={() => setTier(s.tier)}
              className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                s.tier === tier
                  ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
                  : "border-slate-200 text-slate-600 hover:border-slate-400 dark:border-slate-800 dark:text-slate-400 dark:hover:border-slate-600"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <WhatsAppBubble sender={invoice.tenant?.brand_display_name || "Wasool"} text={text} buttonHref={`/pay/${invoice.id}`} />
        <div className="text-xs text-slate-500">
          To: <span className="font-mono text-slate-800 dark:text-slate-300">{invoice.debtor?.phone || "—"}</span> • Template{" "}
          <code className="text-emerald-600 dark:text-emerald-400">{stage.templateName}</code>
        </div>
      </div>

      <div className="space-y-4">
        {upi && (
          <div className="flex gap-4 rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950 p-4">
            <div className="shrink-0 rounded-lg bg-white p-1.5 shadow-sm">
              <UpiQr value={upi} size={104} />
            </div>
            <div className="min-w-0">
              <div className="label">UPI intent</div>
              <code className="block break-all text-[11px] text-emerald-600 dark:text-emerald-400 font-mono">{upi}</code>
              <a href={`/pay/${invoice.id}`} target="_blank" className="mt-2 inline-block text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline">
                Open payment page ↗
              </a>
            </div>
          </div>
        )}

        <div>
          <div className="label">Escalation timeline</div>
          <ol className="space-y-1.5 text-xs">
            {invoice.dispatches.length === 0 && <li className="text-slate-500">No reminders scheduled.</li>}
            {invoice.dispatches.map((d) => (
              <li key={d.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 dark:border-slate-800 px-3 py-2 bg-slate-50/50 dark:bg-transparent">
                <span className="text-slate-800 dark:text-slate-300 font-medium">{STAGE_BY_TIER[d.tier].label}</span>
                <span className="text-slate-500">{formatDateIN(d.scheduled_for)}</span>
                <span className={`font-semibold ${STATUS_STYLE[d.delivery_status] ?? ""}`} title={d.error_message ?? undefined}>
                  {d.delivery_status}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
