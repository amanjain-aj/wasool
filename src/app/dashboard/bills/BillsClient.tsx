"use client";

import { useState } from "react";
import { formatINR, formatDateIN, daysOverdue } from "@/lib/dates";
import { Search, FileText, Image as ImageIcon, ExternalLink, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import type { InvoiceWithRelations } from "@/types/wasool";

export function BillsClient({ invoices, today }: { invoices: InvoiceWithRelations[]; today: string }) {
  const [search, setSearch] = useState("");
  const [filterDoc, setFilterDoc] = useState<string>("ALL");

  const filtered = invoices.filter((inv) => {
    if (filterDoc !== "ALL" && inv.doc_type !== filterDoc) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        inv.invoice_number.toLowerCase().includes(q) ||
        inv.debtor?.client_name?.toLowerCase().includes(q) ||
        inv.debtor?.phone?.includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/60 p-4 shadow-sm">
        <div className="flex items-center gap-2 max-w-sm w-full rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950 px-3 py-2 text-xs">
          <Search className="h-4 w-4 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            className="w-full bg-transparent text-slate-900 placeholder:text-slate-400 dark:text-white dark:placeholder:text-slate-600 focus:outline-none"
            placeholder="Search party name, invoice #, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3">
          <select
            className="rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
            value={filterDoc}
            onChange={(e) => setFilterDoc(e.target.value)}
          >
            <option value="ALL">All Document Types</option>
            <option value="HANDWRITTEN_DIARY">Handwritten Diary Page</option>
            <option value="KHATABOOK_REPORT">Khatabook / Vyapar PDF</option>
            <option value="GST_INVOICE">GST Tax Invoice</option>
            <option value="DELIVERY_CHALLAN">Delivery Challan</option>
            <option value="KACCHA_ESTIMATE">Kaccha Estimate Slip</option>
            <option value="VOICE_ENTRY">WhatsApp Voice Entry</option>
          </select>
        </div>
      </div>

      {/* Bills Ledger Table */}
      <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/60 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 dark:bg-slate-950/80 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3 font-semibold">Debtor / Client</th>
                <th className="px-4 py-3 font-semibold">Bill # &amp; Ingestion Type</th>
                <th className="px-4 py-3 font-semibold text-right">Total (₹)</th>
                <th className="px-4 py-3 font-semibold text-right">Pending (₹)</th>
                <th className="px-4 py-3 font-semibold">Due Date</th>
                <th className="px-4 py-3 font-semibold">Original Bill Copy</th>
                <th className="px-4 py-3 font-semibold text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700 dark:divide-slate-800/60 dark:text-slate-300">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    No bills found in this ledger view.
                  </td>
                </tr>
              ) : (
                filtered.map((inv) => {
                  const overdueDays = daysOverdue(inv.due_date, today);
                  const isPaid = inv.status === "PAID";
                  const docLabel = (inv.doc_type || "GST_INVOICE").replace(/_/g, " ");

                  return (
                    <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition">
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900 dark:text-white">{inv.debtor?.client_name || "Unknown Party"}</div>
                        <div className="text-[11px] text-slate-500">{inv.debtor?.phone || "No phone"}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">{inv.invoice_number}</div>
                        <span className="rounded bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 px-1.5 py-0.5 text-[9px] uppercase font-semibold">
                          {docLabel}
                        </span>
                        {inv.batch_import_id && (
                          <div className="text-[9px] text-slate-500 mt-0.5 font-mono">
                            batch: {inv.batch_import_id.slice(0, 8)}...
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-500 dark:text-slate-400">
                        ₹{formatINR(inv.amount_total_inr)}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-slate-900 dark:text-white">
                        ₹{formatINR(inv.amount_pending_inr)}
                        {Number(inv.amount_kattauti_tds_inr || 0) > 0 && (
                          <div className="text-[10px] text-amber-600 dark:text-amber-400">
                            -₹{formatINR(inv.amount_kattauti_tds_inr)} TDS
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-800 dark:text-slate-200">{formatDateIN(inv.due_date)}</div>
                        <div className="text-[10px] text-slate-500">
                          {overdueDays > 0 ? `${overdueDays}d overdue` : "On schedule"}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {inv.media_storage_url ? (
                          <a
                            href={inv.media_storage_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded bg-slate-100 text-sky-600 hover:text-sky-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-sky-400 dark:hover:text-white px-2 py-1 text-[11px] font-medium"
                          >
                            <ImageIcon className="h-3 w-3" /> View Header Media <ExternalLink className="h-2.5 w-2.5" />
                          </a>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-600 italic">No media copy</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {isPaid ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="h-3 w-3" /> PAID
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/10 px-2 py-0.5 text-[10px] font-bold text-sky-600 dark:text-sky-400">
                            <Clock className="h-3 w-3" /> {inv.status}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
