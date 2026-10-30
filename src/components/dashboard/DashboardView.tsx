"use client";

import { useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowUpDown,
  CheckCircle2,
  Clock,
  Eye,
  FileSpreadsheet,
  IndianRupee,
  MessageSquare,
  Play,
  RotateCcw,
  Search,
  Send,
  Shield,
  Smartphone,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import type { InvoiceStatus, InvoiceWithRelations, ReminderDispatch, Tenant } from "@/types/wasool";
import { BUCKET_LABELS, agingBucket, type AgingBucket } from "@/lib/escalation";
import { daysOverdue, formatDateIN, formatINR } from "@/lib/dates";
import { Modal } from "./Modal";
import { PreviewPanel } from "./PreviewPanel";
import { SettleForm } from "./SettleForm";
import { CsvImporter } from "./CsvImporter";

interface DashboardViewProps {
  tenants: Tenant[];
  initialTenantId: string;
  invoices: InvoiceWithRelations[];
  recentDispatches: Array<ReminderDispatch & { invoice_number: string; client_name: string }>;
  today: string;
}

export function DashboardView({
  tenants,
  initialTenantId,
  invoices: initialInvoices,
  recentDispatches: initialDispatches,
  today,
}: DashboardViewProps) {
  const [tenantId, setTenantId] = useState(initialTenantId);
  const [invoices, setInvoices] = useState(initialInvoices);
  const [dispatches, setDispatches] = useState(initialDispatches);
  const [activeBucket, setActiveBucket] = useState<AgingBucket | "ALL">("ALL");
  const [search, setSearch] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceWithRelations | null>(null);
  const [settlingInvoice, setSettlingInvoice] = useState<InvoiceWithRelations | null>(null);
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [runningCron, setRunningCron] = useState(false);
  const [sendingNowId, setSendingNowId] = useState<string | null>(null);

  const activeTenant = tenants.find((t) => t.id === tenantId) || tenants[0];

  // Refresh helper
  async function refreshData(tId = tenantId) {
    try {
      const res = await fetch(`/api/invoices?tenant_id=${tId}`);
      if (res.ok) {
        const data = await res.json();
        setInvoices(data.invoices);
        setDispatches(data.recent_dispatches);
      }
    } catch (err) {
      console.error("Failed to refresh data", err);
    }
  }

  // Handle switching tenant
  async function switchTenant(newId: string) {
    setTenantId(newId);
    await refreshData(newId);
  }

  // Toggle Autopilot
  async function toggleAutopilot(inv: InvoiceWithRelations) {
    try {
      const res = await fetch(`/api/invoices/${inv.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ autopilot_enabled: !inv.autopilot_enabled }),
      });
      if (res.ok) {
        const { invoice: updated } = await res.json();
        setInvoices((prev) =>
          prev.map((i) => (i.id === updated.id ? { ...i, ...updated } : i))
        );
        setNotification(
          `Autopilot ${updated.autopilot_enabled ? "enabled" : "disabled"} for ${updated.invoice_number}`
        );
      }
    } catch {
      setNotification("Failed to toggle autopilot");
    }
  }

  // Trigger WhatsApp now
  async function handleSendNow(inv: InvoiceWithRelations) {
    setSendingNowId(inv.id);
    try {
      const res = await fetch(`/api/invoices/${inv.id}/remind`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed");
      setNotification(
        `WhatsApp reminder sent (${json.template}) ${json.dry_run ? "— [Dry-Run Mode]" : ""}`
      );
      await refreshData();
    } catch (err) {
      setNotification(err instanceof Error ? err.message : "Error sending WhatsApp");
    } finally {
      setSendingNowId(null);
    }
  }

  // Run Cron on demand
  async function triggerDailyCron() {
    setRunningCron(true);
    try {
      const res = await fetch("/api/invoices/run-dispatch", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Cron failed");
      setNotification(
        `10:30 AM IST Cron Completed: ${json.sent} sent, ${json.skipped} skipped, ${json.failed} failed.`
      );
      await refreshData();
    } catch (err) {
      setNotification(err instanceof Error ? err.message : "Cron execution error");
    } finally {
      setRunningCron(false);
    }
  }

  // Reset Demo store
  async function resetDemoData() {
    if (!confirm("Reset demo data to default realistic Indian invoices?")) return;
    try {
      const res = await fetch("/api/invoices/reset-demo", { method: "POST" });
      if (res.ok) {
        window.location.reload();
      }
    } catch {
      alert("Failed to reset demo");
    }
  }

  // Buckets calculation
  const buckets = useMemo(() => {
    const map: Record<AgingBucket, InvoiceWithRelations[]> = {
      DUE_SOON: [],
      OVERDUE_1_7: [],
      OVERDUE_8_14: [],
      OVERDUE_15_PLUS: [],
      RECOVERED: [],
      CLOSED: [],
    };
    for (const inv of invoices) {
      const b = agingBucket(inv, today);
      map[b].push(inv);
    }
    return map;
  }, [invoices, today]);

  // Aggregate totals
  const metrics = useMemo(() => {
    let pendingAmt = 0;
    let recoveredAmt = 0;
    let atRiskAmt = 0;
    for (const inv of invoices) {
      if (inv.status === "PAID") {
        recoveredAmt += inv.amount_total_inr;
      } else if (inv.status === "PENDING" || inv.status === "PARTIALLY_PAID") {
        pendingAmt += inv.amount_pending_inr;
        const d = daysOverdue(inv.due_date, today);
        if (d > 7) atRiskAmt += inv.amount_pending_inr;
      }
    }
    return { pendingAmt, recoveredAmt, atRiskAmt };
  }, [invoices, today]);

  // Filtered invoices
  const filtered = useMemo(() => {
    return invoices.filter((inv) => {
      if (activeBucket !== "ALL") {
        if (agingBucket(inv, today) !== activeBucket) return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          inv.invoice_number.toLowerCase().includes(q) ||
          inv.debtor.client_name.toLowerCase().includes(q) ||
          inv.debtor.phone.includes(q)
        );
      }
      return true;
    });
  }, [invoices, activeBucket, search, today]);

  return (
    <div className="space-y-6">
      {/* Top Banner / Notification */}
      {notification && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          <span>{notification}</span>
          <button
            onClick={() => setNotification(null)}
            className="text-xs font-bold uppercase tracking-wider text-emerald-400 hover:text-white"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Tenant Selector & Actions Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
            <IndianRupee className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <select
                className="bg-transparent font-bold text-white focus:outline-none cursor-pointer"
                value={tenantId}
                onChange={(e) => switchTenant(e.target.value)}
              >
                {tenants.map((t) => (
                  <option key={t.id} value={t.id} className="bg-slate-900 text-white">
                    {t.brand_display_name} ({t.type === "INTEGRATION_PARTNER" ? "Partner" : "Direct"})
                  </option>
                ))}
              </select>
            </div>
            <div className="text-xs text-slate-400">
              UPI VPA: <span className="font-mono text-slate-300">{activeTenant?.upi_vpa}</span> •{" "}
              {activeTenant?.gstin ? `GSTIN: ${activeTenant.gstin}` : "GST Exempt"}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowCsvModal(true)}
            className="btn-secondary text-xs"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-400" /> Upload CSV
          </button>
          <button
            onClick={triggerDailyCron}
            disabled={runningCron}
            className="btn-secondary text-xs"
            title="Simulate 10:30 AM IST QStash Cron"
          >
            <Play className={`h-4 w-4 text-sky-400 ${runningCron ? "animate-spin" : ""}`} />
            Run 10:30 AM Cron
          </button>
          <button
            onClick={resetDemoData}
            className="btn-secondary text-xs text-slate-400 hover:text-white"
            title="Reset store to seeded Indian demo data"
          >
            <RotateCcw className="h-4 w-4" /> Reset Demo
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Pending A/R</div>
          <div className="mt-2 text-3xl font-extrabold text-white">₹{formatINR(metrics.pendingAmt)}</div>
          <div className="mt-1 text-xs text-slate-500">Active collectible receivables</div>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="text-xs font-semibold uppercase tracking-wider text-rose-400">Critical At-Risk (&gt;7 Days)</div>
          <div className="mt-2 text-3xl font-extrabold text-rose-400">₹{formatINR(metrics.atRiskAmt)}</div>
          <div className="mt-1 text-xs text-slate-500">Overdue milestone capital</div>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Recovered (Paid)</div>
          <div className="mt-2 text-3xl font-extrabold text-emerald-400">₹{formatINR(metrics.recoveredAmt)}</div>
          <div className="mt-1 text-xs text-slate-500">Collected via WhatsApp &amp; UPI</div>
        </div>
      </div>

      {/* Aging Receivables Filter Buckets */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setActiveBucket("ALL")}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
            activeBucket === "ALL"
              ? "bg-emerald-500 text-slate-950"
              : "border border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-700"
          }`}
        >
          All Invoices ({invoices.length})
        </button>
        {(["DUE_SOON", "OVERDUE_1_7", "OVERDUE_8_14", "OVERDUE_15_PLUS", "RECOVERED"] as AgingBucket[]).map((b) => {
          const count = buckets[b].length;
          const isSelected = activeBucket === b;
          return (
            <button
              key={b}
              onClick={() => setActiveBucket(b)}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                isSelected
                  ? "bg-slate-100 text-slate-950"
                  : "border border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-700"
              }`}
            >
              {BUCKET_LABELS[b]} ({count})
            </button>
          );
        })}
      </div>

      {/* Search & Invoices Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
        <div className="flex items-center gap-2 border-b border-slate-800 px-4 py-3">
          <Search className="h-4 w-4 text-slate-500" />
          <input
            type="text"
            className="w-full bg-transparent text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none"
            placeholder="Search invoice number, client or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400">
              <tr>
                <th className="px-4 py-3 font-semibold">Client &amp; Contact</th>
                <th className="px-4 py-3 font-semibold">Invoice #</th>
                <th className="px-4 py-3 font-semibold text-right">Amount (₹)</th>
                <th className="px-4 py-3 font-semibold">Due Date</th>
                <th className="px-4 py-3 font-semibold">Status / Age</th>
                <th className="px-4 py-3 font-semibold text-center">Autopilot</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    No invoices matching the current filter.
                  </td>
                </tr>
              ) : (
                filtered.map((inv) => {
                  const overdueDays = daysOverdue(inv.due_date, today);
                  const isPaid = inv.status === "PAID";
                  const nextDispatch = inv.dispatches.find((d) => d.delivery_status === "QUEUED");

                  return (
                    <tr key={inv.id} className="hover:bg-slate-800/30 transition">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-white">{inv.debtor.client_name}</div>
                        <div className="text-[11px] text-slate-500">{inv.debtor.phone}</div>
                      </td>
                      <td className="px-4 py-3 font-mono text-emerald-400">
                        {inv.invoice_number}
                        {inv.external_invoice_id && (
                          <div className="text-[10px] text-slate-500">ext: {inv.external_invoice_id}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="font-bold text-white">
                          ₹{formatINR(isPaid ? inv.amount_total_inr : inv.amount_pending_inr)}
                        </div>
                        {inv.status === "PARTIALLY_PAID" && (
                          <div className="text-[10px] text-amber-400">partially paid</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div>{formatDateIN(inv.due_date)}</div>
                        <div className="text-[10px] text-slate-500">
                          {overdueDays > 0
                            ? `${overdueDays}d overdue`
                            : overdueDays === 0
                            ? "Due today"
                            : `In ${Math.abs(overdueDays)}d`}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {isPaid ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                            <CheckCircle2 className="h-3 w-3" /> PAID
                          </span>
                        ) : overdueDays > 7 ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold text-rose-400">
                            <AlertCircle className="h-3 w-3" /> Overdue
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/10 px-2 py-0.5 text-[10px] font-bold text-sky-400">
                            <Clock className="h-3 w-3" /> {inv.status}
                          </span>
                        )}
                        {nextDispatch && (
                          <div className="mt-1 text-[10px] text-slate-400">
                            Next: {nextDispatch.tier.replace("T_", "").toLowerCase()} on {nextDispatch.scheduled_for}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => toggleAutopilot(inv)}
                          disabled={isPaid}
                          className="text-slate-400 hover:text-white disabled:opacity-30"
                          title="Toggle automated WhatsApp escalation"
                        >
                          {inv.autopilot_enabled ? (
                            <ToggleRight className="h-6 w-6 text-emerald-400" />
                          ) : (
                            <ToggleLeft className="h-6 w-6 text-slate-600" />
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedInvoice(inv)}
                            className="rounded p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
                            title="Preview WhatsApp Template &amp; UPI Link"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {!isPaid && (
                            <>
                              <button
                                onClick={() => handleSendNow(inv)}
                                disabled={sendingNowId === inv.id}
                                className="rounded p-1.5 text-emerald-400 hover:bg-slate-800 hover:text-emerald-300"
                                title="Send WhatsApp Escalation Immediately"
                              >
                                <Send className={`h-4 w-4 ${sendingNowId === inv.id ? "animate-pulse" : ""}`} />
                              </button>
                              <button
                                onClick={() => setSettlingInvoice(inv)}
                                className="rounded bg-emerald-500/10 px-2 py-1 text-[11px] font-bold text-emerald-400 hover:bg-emerald-500 hover:text-slate-950 transition"
                              >
                                Mark Paid
                              </button>
                            </>
                          )}
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

      {/* Recent Dispatches Feed */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-bold text-white flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-emerald-400" /> WhatsApp Escalation Audit Log
          </div>
          <span className="text-xs text-slate-500">Last 25 dispatched events</span>
        </div>
        <div className="space-y-2">
          {dispatches.length === 0 ? (
            <p className="text-xs text-slate-500">No WhatsApp messages dispatched yet.</p>
          ) : (
            dispatches.map((d) => (
              <div
                key={d.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl border border-slate-800/80 bg-slate-950/40 px-3 py-2 text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-emerald-400">{d.invoice_number}</span>
                  <span className="text-slate-300">{d.client_name}</span>
                  <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400">
                    {d.tier}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-slate-400 text-[11px]">
                  <span>{d.dispatched_at ? new Date(d.dispatched_at).toLocaleTimeString("en-IN") : d.scheduled_for}</span>
                  <span
                    className={`font-semibold ${
                      d.delivery_status === "READ"
                        ? "text-emerald-400"
                        : d.delivery_status === "FAILED"
                        ? "text-rose-400"
                        : "text-sky-400"
                    }`}
                  >
                    {d.delivery_status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modals */}
      {selectedInvoice && (
        <Modal
          title={`Invoice #${selectedInvoice.invoice_number} — Preview &amp; Audit`}
          onClose={() => setSelectedInvoice(null)}
          wide
        >
          <PreviewPanel invoice={selectedInvoice} today={today} />
        </Modal>
      )}

      {settlingInvoice && (
        <Modal
          title={`Mark Invoice #${settlingInvoice.invoice_number} as Paid`}
          onClose={() => setSettlingInvoice(null)}
        >
          <SettleForm
            invoice={settlingInvoice}
            onSettled={(msg) => {
              setSettlingInvoice(null);
              setNotification(msg);
              refreshData();
            }}
          />
        </Modal>
      )}

      {showCsvModal && (
        <Modal
          title="Upload Invoices CSV / Excel"
          onClose={() => setShowCsvModal(false)}
        >
          <CsvImporter
            tenantId={tenantId}
            onDone={() => {
              setShowCsvModal(false);
              setNotification("CSV invoices imported successfully!");
              refreshData();
            }}
          />
        </Modal>
      )}
    </div>
  );
}
