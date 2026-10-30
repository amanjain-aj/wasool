import Link from "next/link";
import { ApiPlayground } from "./ApiPlayground";
import { ESCALATION_STAGES } from "@/lib/escalation";

export const metadata = { title: "Partner API — Wasool.io" };

const Code = ({ children }: { children: string }) => (
  <pre className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs leading-relaxed text-emerald-400">{children}</pre>
);

export default function PartnerDocsPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <header className="mb-10 flex items-center justify-between">
        <Link href="/" className="text-2xl font-black tracking-tight text-white">
          Wasool<span className="text-emerald-500">.io</span>
          <span className="ml-2 text-sm font-semibold text-slate-500">Partner API</span>
        </Link>
        <a href="mailto:partners@wasool.io" className="btn-secondary">Request production key</a>
      </header>

      <section className="space-y-4">
        <h1 className="text-3xl font-bold text-white">Embedded Autopilot Collections</h1>
        <p className="max-w-3xl text-sm leading-relaxed text-slate-400">
          Bookkeeping platforms (Khatabook, myBillBook, Vyapar, Swipe) integrate Wasool as a white-label background worker with two REST endpoints.
          Call <code className="text-emerald-400">/sync</code> when a merchant toggles &quot;Auto-Remind&quot; on an invoice, and <code className="text-emerald-400">/settle</code> when
          the invoice is paid. We handle Meta template compliance, the 10:30 AM IST escalation queue and UPI deep-link generation.
        </p>
      </section>

      <section className="mt-10 grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <h2 className="font-bold text-white">Authentication</h2>
          <p className="mt-2 text-sm text-slate-400">Every request carries your partner key. Keys are stored only as SHA-256 hashes and are bound to your <code>partner_id</code>.</p>
          <Code>{`Authorization: Bearer wsl_live_xxxxxxxxxxxxxxxx
Content-Type: application/json`}</Code>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <h2 className="font-bold text-white">Escalation schedule</h2>
          <ul className="mt-3 space-y-1.5 text-sm">
            {ESCALATION_STAGES.map((s) => (
              <li key={s.tier} className="flex justify-between gap-4 text-slate-300">
                <span>{s.label}</span>
                <code className="text-xs text-emerald-400">{s.templateName}</code>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-slate-500">Sent at 10:30 AM IST. Late-synced invoices receive only the most recent applicable stage.</p>
        </div>
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="text-xl font-bold text-white">
          <span className="mr-2 rounded bg-emerald-500/15 px-2 py-0.5 font-mono text-sm text-emerald-400">POST</span>
          /api/v1/partner/invoices/sync
        </h2>
        <p className="text-sm text-slate-400">Upserts the merchant, debtor and invoice (idempotent on <code>merchant.id</code> and <code>invoice.number</code>), generates the UPI intent and (re)schedules reminders.</p>
        <div className="grid gap-4 md:grid-cols-2">
          <Code>{`// Request
{
  "partner_id": "khatabook",
  "merchant": {
    "id": "kb_99281",
    "business_name": "Sharma Traders",
    "upi_vpa": "sharmatraders@hdfcbank",
    "phone": "+919876501234",      // optional
    "email": "owner@sharma.in",    // optional
    "gstin": "27ABCDE1234F1Z5"     // optional
  },
  "debtor": {
    "name": "Metro Retail Pvt Ltd",
    "phone": "+919820112233",
    "contact_person": "Suresh"     // optional, used in greeting
  },
  "invoice": {
    "number": "INV-2026-884",
    "external_id": "kb_inv_884",   // optional
    "amount_total": 64200.00,      // optional, defaults to pending
    "amount_pending": 64200.00,
    "issue_date": "2026-10-16",    // optional, defaults to today
    "due_date": "2026-11-15"
  }
}`}</Code>
          <Code>{`// 201 Created
{
  "status": "scheduled",
  "invoice_id": "3f6c…",
  "invoice_status": "PENDING",
  "upi_intent_url": "upi://pay?pa=sharmatraders%40hdfcbank&pn=Sharma+Traders&am=64200.00&cu=INR&tn=Inv+INV-2026-884",
  "reminders": [
    { "tier": "T_MINUS_2_COURTESY", "scheduled_for": "2026-11-13" },
    { "tier": "T_ZERO_DUE_DATE", "scheduled_for": "2026-11-15" },
    …
  ]
}

// Errors
401 Unauthorized Partner Key
403 key not authorised for partner_id
422 validation error (phone, VPA, amounts, dates)`}</Code>
        </div>
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="text-xl font-bold text-white">
          <span className="mr-2 rounded bg-emerald-500/15 px-2 py-0.5 font-mono text-sm text-emerald-400">POST</span>
          /api/v1/partner/invoices/settle
        </h2>
        <p className="text-sm text-slate-400">Marks the invoice <code>PAID</code>, records the UTR and deletes all queued reminders. Send <code>amount_paid</code> below the pending amount to record a part-payment (reminders continue for the balance).</p>
        <div className="grid gap-4 md:grid-cols-2">
          <Code>{`{
  "partner_id": "khatabook",
  "merchant_id": "kb_99281",
  "invoice_number": "INV-2026-884",   // or "external_invoice_id"
  "utr_reference": "431902218874",
  "amount_paid": 64200.00             // optional
}`}</Code>
          <Code>{`{
  "status": "PAID",            // or PARTIALLY_PAID / ALREADY_PAID
  "invoice_id": "3f6c…",
  "amount_pending_inr": 0,
  "utr_reference": "431902218874",
  "cancelled_reminders": 3
}`}</Code>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="mb-4 text-xl font-bold text-white">Live playground</h2>
        <ApiPlayground />
      </section>
    </main>
  );
}
