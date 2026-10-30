"use client";

import { useMemo, useState } from "react";
import { ESCALATION_STAGES, renderTemplate } from "@/lib/escalation";
import { buildUPILink, isValidVPA } from "@/lib/upi";
import { addDays, todayIST } from "@/lib/dates";
import { WhatsAppBubble } from "./WhatsAppBubble";
import { UpiQr } from "./UpiQr";

/** Landing-page interactive previewer: UPI deep link + each escalation template. */
export function LiveMessagePreview() {
  const [brand, setBrand] = useState("Sharma Traders");
  const [vpa, setVpa] = useState("sharmatraders@hdfcbank");
  const [client, setClient] = useState("Suresh");
  const [invoiceNo, setInvoiceNo] = useState("INV-2026-884");
  const [amount, setAmount] = useState("64200");
  const [dueDate, setDueDate] = useState(() => addDays(todayIST(), 2));
  const [tierIdx, setTierIdx] = useState(0);

  const amountNum = Number(amount) || 0;
  const vpaOk = isValidVPA(vpa);
  const stage = ESCALATION_STAGES[tierIdx];
  const upi = useMemo(
    () => buildUPILink(vpaOk ? vpa : "merchant@upi", brand || "Merchant", amountNum, invoiceNo || "INV"),
    [vpa, vpaOk, brand, amountNum, invoiceNo],
  );
  const text = renderTemplate(stage, {
    clientName: client || "Client",
    brandName: brand || "Your Business",
    invoiceNumber: invoiceNo || "INV",
    amountPending: amountNum,
    dueDate,
  });

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="label">Your business name</label>
            <input className="input" value={brand} onChange={(e) => setBrand(e.target.value)} />
          </div>
          <div className="col-span-2">
            <label className="label">Your UPI VPA</label>
            <input className={`input ${vpaOk ? "" : "border-rose-500"}`} value={vpa} onChange={(e) => setVpa(e.target.value)} />
            {!vpaOk && <p className="mt-1 text-xs text-rose-400">Format: handle@bank (e.g. yourbiz@icici)</p>}
          </div>
          <div>
            <label className="label">Client name</label>
            <input className="input" value={client} onChange={(e) => setClient(e.target.value)} />
          </div>
          <div>
            <label className="label">Invoice #</label>
            <input className="input" value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} />
          </div>
          <div>
            <label className="label">Amount (₹)</label>
            <input className="input" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div>
            <label className="label">Due date</label>
            <input className="input" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="label">Escalation stage</label>
          <div className="flex flex-wrap gap-2">
            {ESCALATION_STAGES.map((s, i) => (
              <button
                key={s.tier}
                onClick={() => setTierIdx(i)}
                className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                  i === tierIdx ? "border-emerald-500 bg-emerald-500/10 text-emerald-300" : "border-slate-800 text-slate-400 hover:border-slate-600"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
          <div className="label">Generated NPCI UPI intent</div>
          <code className="block break-all text-xs text-emerald-400">{upi}</code>
        </div>
      </div>

      <div className="space-y-4">
        <WhatsAppBubble sender={brand || "Your Business"} text={text} buttonHref={upi} />
        <div className="flex items-center gap-4 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="rounded-lg bg-white p-1.5">
            <UpiQr value={upi} size={112} />
          </div>
          <p className="text-xs leading-relaxed text-slate-400">
            On mobile, the button opens GPay / PhonePe / Paytm with <strong className="text-slate-200">₹{amountNum.toLocaleString("en-IN")}</strong> pre-filled.
            On desktop, the payment page shows this QR. Template: <code className="text-emerald-400">{stage.templateName}</code>
          </p>
        </div>
      </div>
    </div>
  );
}
