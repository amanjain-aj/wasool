"use client";

import { useState } from "react";
import { Users, CheckCircle2, XCircle, Search, ShieldCheck, RefreshCw, AlertCircle } from "lucide-react";
import type { Tenant } from "@/types/wasool";

export function TenantsClient({ initialTenants }: { initialTenants: Tenant[] }) {
  const [tenants, setTenants] = useState<Tenant[]>(initialTenants);
  const [search, setSearch] = useState("");
  const [filterPlan, setFilterPlan] = useState<string>("ALL");
  const [filterRegistration, setFilterRegistration] = useState<string>("ALL");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const filtered = tenants.filter((t) => {
    if (filterPlan !== "ALL" && (t.subscription_plan || t.plan_tier) !== filterPlan) return false;
    if (filterRegistration === "REGISTERED" && t.is_registered === false) return false;
    if (filterRegistration === "GATED" && (t.is_registered === true || t.is_active === true)) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        t.business_name.toLowerCase().includes(q) ||
        t.owner_phone.includes(q) ||
        t.owner_email.toLowerCase().includes(q) ||
        (t.upi_vpa && t.upi_vpa.toLowerCase().includes(q))
      );
    }
    return true;
  });

  async function updateTenantStatus(tenantId: string, patch: Partial<Tenant>) {
    setUpdatingId(tenantId);
    try {
      const res = await fetch(`/api/admin/tenants/${tenantId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");

      setTenants((prev) => prev.map((t) => (t.id === tenantId ? { ...t, ...patch } : t)));
      setNotification(`Tenant updated successfully.`);
      setTimeout(() => setNotification(null), 3000);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error updating tenant");
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="space-y-6">
      {notification && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-300 flex items-center justify-between">
          <span>{notification}</span>
          <button onClick={() => setNotification(null)} className="font-bold uppercase tracking-wider text-[10px]">
            Dismiss
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
        <div className="flex items-center gap-2 max-w-sm w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs">
          <Search className="h-4 w-4 text-slate-500" />
          <input
            type="text"
            className="w-full bg-transparent text-white placeholder:text-slate-600 focus:outline-none"
            placeholder="Search business name, phone, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-300 focus:outline-none"
            value={filterRegistration}
            onChange={(e) => setFilterRegistration(e.target.value)}
          >
            <option value="ALL">All Gating Status</option>
            <option value="REGISTERED">Active / Registered (Dispatches Allowed)</option>
            <option value="GATED">Gated / Incomplete (Dispatches Blocked)</option>
          </select>

          <select
            className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-300 focus:outline-none"
            value={filterPlan}
            onChange={(e) => setFilterPlan(e.target.value)}
          >
            <option value="ALL">All Subscription Plans</option>
            <option value="FREE_TRIAL">Free Trial</option>
            <option value="munshi_standard">Munshi Standard (₹999)</option>
            <option value="munshi_vyapar_pro">Munshi Vyapar Pro (₹2,499)</option>
            <option value="growth">Growth</option>
            <option value="partner_embedded">Partner Embedded</option>
          </select>
        </div>
      </div>

      {/* Tenants Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400">
              <tr>
                <th className="px-4 py-3 font-semibold">Business / Owner</th>
                <th className="px-4 py-3 font-semibold">Phone &amp; Email</th>
                <th className="px-4 py-3 font-semibold">UPI VPA &amp; GSTIN</th>
                <th className="px-4 py-3 font-semibold">Gating Status</th>
                <th className="px-4 py-3 font-semibold">Subscription Plan</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    No businesses matching the selected filter.
                  </td>
                </tr>
              ) : (
                filtered.map((t) => {
                  const isRegistered = t.is_registered === true || (t.is_registered !== false && t.is_active);
                  const isBusy = updatingId === t.id;

                  return (
                    <tr key={t.id} className="hover:bg-slate-800/30 transition">
                      <td className="px-4 py-3">
                        <div className="font-bold text-white">{t.business_name}</div>
                        <div className="text-[11px] text-slate-400">{t.brand_display_name}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-mono text-white">{t.owner_phone}</div>
                        <div className="text-[11px] text-slate-500">{t.owner_email}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-mono text-emerald-400">{t.upi_vpa || "Not configured"}</div>
                        <div className="text-[10px] text-slate-500">{t.gstin || "No GSTIN"}</div>
                      </td>
                      <td className="px-4 py-3">
                        {isRegistered ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                            <CheckCircle2 className="h-3 w-3" /> REGISTERED
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold text-amber-400">
                            <XCircle className="h-3 w-3" /> GATED (INCOMPLETE)
                          </span>
                        )}
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          Step: {t.registration_step || "PENDING_PHONE"}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          className="rounded-lg border border-slate-800 bg-slate-950 px-2 py-1 text-xs text-white"
                          value={t.subscription_plan || t.plan_tier || "FREE_TRIAL"}
                          disabled={isBusy}
                          onChange={(e) => updateTenantStatus(t.id, { subscription_plan: e.target.value })}
                        >
                          <option value="FREE_TRIAL">Free Trial (14-Day)</option>
                          <option value="munshi_standard">Munshi Standard (₹999)</option>
                          <option value="munshi_vyapar_pro">Munshi Vyapar Pro (₹2,499)</option>
                          <option value="growth">Growth</option>
                          <option value="partner_embedded">Partner Embedded</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => updateTenantStatus(t.id, { is_registered: !isRegistered })}
                            disabled={isBusy}
                            className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                              isRegistered
                                ? "bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20"
                                : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20"
                            }`}
                          >
                            {isRegistered ? "Block / Gate" : "Approve & Activate"}
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
