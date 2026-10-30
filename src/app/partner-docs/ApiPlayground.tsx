"use client";

import { useEffect, useState } from "react";
import { Loader2, Play } from "lucide-react";
import { addDays, todayIST } from "@/lib/dates";

type Endpoint = "sync" | "settle";

function samples(): Record<Endpoint, string> {
  return {
    sync: JSON.stringify(
      {
        partner_id: "khatabook",
        merchant: { id: "kb_99281", business_name: "Sharma Traders", upi_vpa: "sharmatraders@hdfcbank" },
        debtor: { name: "Metro Retail Pvt Ltd", phone: "+919820112233", contact_person: "Suresh" },
        invoice: { number: "INV-2026-884", amount_pending: 64200.0, due_date: addDays(todayIST(), 16) },
      },
      null,
      2,
    ),
    settle: JSON.stringify(
      { partner_id: "khatabook", merchant_id: "kb_99281", invoice_number: "INV-2026-884", utr_reference: "431902218874" },
      null,
      2,
    ),
  };
}

export function ApiPlayground() {
  const [endpoint, setEndpoint] = useState<Endpoint>("sync");
  const [bodies, setBodies] = useState<Record<Endpoint, string>>(samples);
  const [apiKey, setApiKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [response, setResponse] = useState<{ status: number; body: string; ms: number } | null>(null);
  const [mode, setMode] = useState<string>("");

  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then((h) => {
        setMode(`${h.store} store • WhatsApp ${h.whatsapp}`);
        if (h.demo_partner_key) setApiKey((k) => k || h.demo_partner_key);
      })
      .catch(() => {});
  }, []);

  async function send() {
    setBusy(true);
    setResponse(null);
    const t0 = performance.now();
    try {
      const res = await fetch(`/api/v1/partner/invoices/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey.trim()}` },
        body: bodies[endpoint],
      });
      const text = await res.text();
      let pretty = text;
      try {
        pretty = JSON.stringify(JSON.parse(text), null, 2);
      } catch {}
      setResponse({ status: res.status, body: pretty, ms: Math.round(performance.now() - t0) });
    } catch (err) {
      setResponse({ status: 0, body: String(err), ms: Math.round(performance.now() - t0) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        {(["sync", "settle"] as Endpoint[]).map((e) => (
          <button
            key={e}
            onClick={() => {
              setEndpoint(e);
              setResponse(null);
            }}
            className={`rounded-lg px-3 py-1.5 font-mono text-xs font-semibold ${endpoint === e ? "bg-emerald-500 text-slate-950" : "bg-slate-800 text-slate-300"}`}
          >
            POST /invoices/{e}
          </button>
        ))}
        {mode && <span className="ml-auto text-xs text-slate-500">{mode}</span>}
      </div>
      <label className="label">Partner key</label>
      <input className="input mb-4 font-mono" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="wsl_live_..." />
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="label">Request body</label>
          <textarea
            className="input h-80 font-mono text-xs"
            spellCheck={false}
            value={bodies[endpoint]}
            onChange={(e) => setBodies((b) => ({ ...b, [endpoint]: e.target.value }))}
          />
        </div>
        <div>
          <label className="label">
            Response {response && <span className={response.status < 300 ? "text-emerald-400" : "text-rose-400"}>{response.status} • {response.ms}ms</span>}
          </label>
          <pre className="h-80 overflow-auto rounded-lg border border-slate-800 bg-slate-950 p-3 font-mono text-xs text-slate-300">
            {response?.body ?? "// Send a request to see the response"}
          </pre>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button className="btn-primary" onClick={send} disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />} Send request
        </button>
        <button className="btn-secondary" onClick={() => setBodies(samples())}>Reset samples</button>
      </div>
    </div>
  );
}
