"use client";

import { useState } from "react";
import { CheckCircle2, XCircle, Search, ExternalLink, Image as ImageIcon, Check, Ban } from "lucide-react";
import { formatINR } from "@/lib/dates";

export function ReconciliationsClient({ initialReconciliations }: { initialReconciliations: any[] }) {
  const [list, setList] = useState(initialReconciliations);
  const [filter, setFilter] = useState("ALL");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const filtered = list.filter((r) => {
    if (filter === "PENDING" && r.status !== "PENDING_OWNER_CONFIRMATION") return false;
    if (filter === "CONFIRMED" && r.status !== "CONFIRMED") return false;
    if (filter === "REJECTED" && r.status !== "REJECTED") return false;
    return true;
  });

  async function handleOverride(id: string, status: "CONFIRMED" | "REJECTED") {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/admin/reconciliations/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, notes: `Manual override by super-admin at ${new Date().toISOString()}` }),
      });
      if (!res.ok) throw new Error("Override failed");

      setList((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status, confirmed_at: status === "CONFIRMED" ? new Date().toISOString() : r.confirmed_at } : r))
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error overriding reconciliation");
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/60 p-4 shadow-sm">
        <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          Showing {filtered.length} payment reconciliations
        </div>
        <div className="flex items-center gap-2">
          {["ALL", "PENDING", "CONFIRMED", "REJECTED"].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                filter === tab
                  ? "bg-rose-500 text-white"
                  : "border border-slate-200 bg-slate-50 text-slate-700 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/60 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 dark:bg-slate-950/80 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3 font-semibold">Debtor &amp; Business</th>
                <th className="px-4 py-3 font-semibold">Invoice #</th>
                <th className="px-4 py-3 font-semibold text-right">Reported Amount (₹)</th>
                <th className="px-4 py-3 font-semibold">Extracted UTR / Cheque</th>
                <th className="px-4 py-3 font-semibold">Proof Screenshot</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold text-right">Admin Override</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700 dark:divide-slate-800/60 dark:text-slate-300">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    No payment reconciliations in this category.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => {
                  const debtorName = r.debtor?.client_name || r.invoice?.debtor?.client_name || "Unknown Party";
                  const businessName = r.tenant?.business_name || r.invoice?.tenant?.business_name || "Wasool Merchant";
                  const invNum = r.invoice?.invoice_number || "Invoice";
                  const isPending = r.status === "PENDING_OWNER_CONFIRMATION";
                  const isBusy = updatingId === r.id;

                  return (
                    <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition">
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900 dark:text-white">{debtorName}</div>
                        <div className="text-[11px] text-slate-500">To: {businessName}</div>
                      </td>
                      <td className="px-4 py-3 font-mono text-emerald-600 dark:text-emerald-400 font-medium">{invNum}</td>
                      <td className="px-4 py-3 font-bold text-slate-900 dark:text-white text-right">
                        ₹{formatINR(r.reported_amount_inr)}
                      </td>
                      <td className="px-4 py-3 font-mono text-sky-600 dark:text-sky-400">
                        {r.utr_or_cheque_number || "NO_UTR_DETECTED"}
                      </td>
                      <td className="px-4 py-3">
                        {r.proof_media_url ? (
                          <a
                            href={r.proof_media_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded bg-slate-100 text-sky-600 hover:text-sky-700 dark:bg-slate-800 dark:text-sky-400 dark:hover:text-white px-2 py-1 text-[11px] font-medium"
                          >
                            <ImageIcon className="h-3 w-3" /> View Proof <ExternalLink className="h-2.5 w-2.5" />
                          </a>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-600 italic">No image file</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {r.status === "CONFIRMED" ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="h-3 w-3" /> CONFIRMED
                          </span>
                        ) : r.status === "REJECTED" ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold text-rose-600 dark:text-rose-400">
                            <XCircle className="h-3 w-3" /> REJECTED
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                            PENDING OWNER
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOverride(r.id, "CONFIRMED")}
                            disabled={isBusy || r.status === "CONFIRMED"}
                            className="rounded bg-emerald-500/10 px-2 py-1 text-[11px] font-bold text-emerald-600 hover:bg-emerald-500 hover:text-white dark:text-emerald-400 dark:hover:bg-emerald-500 dark:hover:text-slate-950 transition disabled:opacity-30"
                            title="Force Mark as Confirmed"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleOverride(r.id, "REJECTED")}
                            disabled={isBusy || r.status === "REJECTED"}
                            className="rounded bg-rose-500/10 px-2 py-1 text-[11px] font-bold text-rose-600 hover:bg-rose-500 hover:text-white dark:text-rose-400 dark:hover:bg-rose-500 dark:hover:text-white transition disabled:opacity-30"
                            title="Force Reject"
                          >
                            <Ban className="h-3.5 w-3.5" />
                          </button>
                        </div>
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
