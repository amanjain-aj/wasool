"use client";

import { useRef, useState } from "react";
import Papa from "papaparse";
import { Download, FileSpreadsheet, Loader2, Upload } from "lucide-react";
import type { CsvInvoiceRow } from "@/types/wasool";

const REQUIRED = ["client_name", "phone", "invoice_number", "amount_total", "due_date"] as const;

// Accept common header variants from Tally / Zoho / hand-made sheets.
const ALIASES: Record<string, keyof CsvInvoiceRow> = {
  client: "client_name",
  client_name: "client_name",
  customer: "client_name",
  customer_name: "client_name",
  party_name: "client_name",
  debtor: "client_name",
  phone: "phone",
  mobile: "phone",
  whatsapp: "phone",
  phone_number: "phone",
  contact_number: "phone",
  invoice: "invoice_number",
  invoice_number: "invoice_number",
  invoice_no: "invoice_number",
  bill_no: "invoice_number",
  amount: "amount_total",
  amount_total: "amount_total",
  total: "amount_total",
  invoice_amount: "amount_total",
  amount_pending: "amount_pending",
  balance: "amount_pending",
  balance_due: "amount_pending",
  outstanding: "amount_pending",
  issue_date: "issue_date",
  invoice_date: "issue_date",
  date: "issue_date",
  due_date: "due_date",
  due: "due_date",
  contact_person: "contact_person",
  contact: "contact_person",
  email: "email",
};

const SAMPLE = `client_name,contact_person,phone,email,invoice_number,amount_total,amount_pending,issue_date,due_date
Metro Retail Pvt Ltd,Suresh Patil,9820112233,accounts@metroretail.in,INV-2026-901,64200,64200,01/10/2026,31/10/2026
Zenith Logistics Pvt Ltd,Rohan Mehta,+91 98201 45678,,INV-2026-902,85000,40000,2026-10-05,2026-11-04
Kaveri Foods & Beverages,Anitha Rao,09845012345,,INV-2026-903,42500,,2026-10-20,2026-11-19
`;

const normKey = (h: string) => h.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");

type ImportResult = { imported: number; failed: number; errors: Array<{ row: number; invoice_number?: string; error: string }> };

export function CsvImporter({ tenantId, onDone }: { tenantId: string; onDone: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<CsvInvoiceRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [parseError, setParseError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [dragging, setDragging] = useState(false);

  function handleFile(file: File) {
    setParseError(null);
    setResult(null);
    setRows([]);
    if (/\.(xlsx|xls)$/i.test(file.name)) {
      setParseError("Excel files: please use File → Save As → CSV (UTF-8) in Excel / Google Sheets, then upload the .csv.");
      return;
    }
    setFileName(file.name);
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: "greedy",
      transformHeader: (h) => ALIASES[normKey(h)] ?? normKey(h),
      complete: (res) => {
        const fields = res.meta.fields ?? [];
        const missing = REQUIRED.filter((r) => !fields.includes(r));
        if (missing.length) {
          setParseError(`Missing required column(s): ${missing.join(", ")}. Download the sample CSV for the expected format.`);
          return;
        }
        setRows(res.data as unknown as CsvInvoiceRow[]);
      },
      error: (err) => setParseError(err.message),
    });
  }

  async function submit() {
    setBusy(true);
    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenant_id: tenantId, rows }),
      });
      const json = await res.json();
      if (!res.ok && !json.errors) throw new Error(json.error || "Import failed");
      setResult(json);
      if (json.imported) onDone();
    } catch (err) {
      setParseError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  function downloadSample() {
    const url = URL.createObjectURL(new Blob([SAMPLE], { type: "text/csv" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: "wasool-sample-invoices.csv" });
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const f = e.dataTransfer.files[0];
          if (f) handleFile(f);
        }}
        onClick={() => fileRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 text-center transition ${
          dragging ? "border-emerald-500 bg-emerald-500/5" : "border-slate-700 hover:border-slate-500"
        }`}
      >
        <FileSpreadsheet className="h-8 w-8 text-emerald-400" />
        <div className="text-sm font-semibold text-white">{fileName || "Drop your overdue invoices CSV here"}</div>
        <div className="text-xs text-slate-500">or click to browse • Tally / Zoho / Excel exports (save as CSV)</div>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv,.xlsx,.xls"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
            e.target.value = "";
          }}
        />
      </div>

      <button onClick={downloadSample} className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300">
        <Download className="h-3.5 w-3.5" /> Download sample CSV
      </button>
      <p className="text-xs text-slate-500">
        Required: <code>client_name, phone, invoice_number, amount_total, due_date</code>. Optional: <code>amount_pending, issue_date, contact_person, email</code>.
        Dates as YYYY-MM-DD or DD/MM/YYYY. Re-uploading an invoice number updates it.
      </p>

      {parseError && <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">{parseError}</p>}

      {rows.length > 0 && !result && (
        <div className="space-y-3">
          <div className="max-h-56 overflow-auto rounded-lg border border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-slate-900 text-slate-400">
                <tr>
                  <th className="px-3 py-2">Client</th>
                  <th className="px-3 py-2">Phone</th>
                  <th className="px-3 py-2">Invoice</th>
                  <th className="px-3 py-2 text-right">Amount</th>
                  <th className="px-3 py-2">Due</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {rows.slice(0, 50).map((r, i) => (
                  <tr key={i}>
                    <td className="px-3 py-1.5">{r.client_name}</td>
                    <td className="px-3 py-1.5">{r.phone}</td>
                    <td className="px-3 py-1.5">{r.invoice_number}</td>
                    <td className="px-3 py-1.5 text-right">{String(r.amount_pending || r.amount_total)}</td>
                    <td className="px-3 py-1.5">{r.due_date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button className="btn-primary w-full" onClick={submit} disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Import {rows.length} invoice{rows.length === 1 ? "" : "s"} & activate autopilot
          </button>
        </div>
      )}

      {result && (
        <div className="space-y-2 rounded-lg border border-slate-800 bg-slate-950 p-4 text-sm">
          <div className="text-emerald-400">✓ {result.imported} imported and scheduled</div>
          {result.failed > 0 && (
            <>
              <div className="text-rose-400">✕ {result.failed} rejected</div>
              <ul className="max-h-40 space-y-1 overflow-auto text-xs text-slate-400">
                {result.errors.map((e) => (
                  <li key={e.row}>
                    Row {e.row} {e.invoice_number ? `(${e.invoice_number})` : ""}: {e.error}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
}
