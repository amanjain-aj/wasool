"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import type { InvoiceWithRelations } from "@/types/wasool";
import { formatINR } from "@/lib/dates";

export function SettleForm({
  invoice,
  onSettled,
}: {
  invoice: InvoiceWithRelations;
  onSettled: (msg: string) => void;
}) {
  const [utr, setUtr] = useState("");
  const [amount, setAmount] = useState(String(invoice.amount_pending_inr));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/invoices/${invoice.id}/settle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ utr_reference: utr || undefined, amount_paid: Number(amount) }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed");
      onSettled(
        json.status === "PARTIALLY_PAID"
          ? `Part-payment recorded. ₹${formatINR(json.invoice.amount_pending_inr)} still pending; reminders continue.`
          : `${invoice.invoice_number} marked PAID. ${json.cancelled_reminders} queued reminder(s) cancelled.`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <p className="text-sm text-slate-400">
        {invoice.debtor.client_name} • {invoice.invoice_number} • Pending <strong className="text-white">₹{formatINR(invoice.amount_pending_inr)}</strong>
      </p>
      <div>
        <label className="label">UPI / bank UTR reference</label>
        <input className="input font-mono" value={utr} onChange={(e) => setUtr(e.target.value)} placeholder="e.g. 431902218874" autoFocus />
      </div>
      <div>
        <label className="label">Amount received (₹)</label>
        <input className="input" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <p className="mt-1 text-xs text-slate-500">Enter less than the pending amount to record a part-payment.</p>
      </div>
      {error && <p className="text-sm text-rose-400">{error}</p>}
      <button className="btn-primary w-full" disabled={busy}>
        {busy && <Loader2 className="h-4 w-4 animate-spin" />} Record payment & halt reminders
      </button>
    </form>
  );
}
