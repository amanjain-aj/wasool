import Link from "next/link";
import { getStore } from "@/lib/store";
import { formatINR } from "@/lib/dates";
import { Users, ShieldCheck, CheckCircle2, Clock, AlertTriangle, ArrowRight, Activity, Receipt } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const store = getStore();
  const [tenants, reconciliations, auditLogs] = await Promise.all([
    store.listTenants(),
    store.listAllReconciliations(),
    store.listAdminAuditLogs(10),
  ]);

  const registeredTenants = tenants.filter((t) => t.is_registered === true || t.is_active === true);
  const gatedTenants = tenants.filter((t) => t.is_registered === false);
  const pendingReconciliations = reconciliations.filter((r) => r.status === "PENDING_OWNER_CONFIRMATION");
  const proSubscribers = tenants.filter((t) => t.subscription_plan === "munshi_vyapar_pro" || t.plan_tier === "growth");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-rose-500" /> Super-Admin Control Panel
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Internal operations hub for tenant registration gating, WhatsApp quotas, and OCR reconciliation overrides.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/60 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase">
            <span>Total Tenants</span>
            <Users className="h-4 w-4 text-sky-500 dark:text-sky-400" />
          </div>
          <div className="mt-3 text-3xl font-black text-slate-900 dark:text-white">{tenants.length}</div>
          <div className="mt-1 text-xs text-slate-500">Businesses onboarded</div>
        </div>

        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5 shadow-sm">
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 text-xs font-semibold uppercase">
            <span>Registered &amp; Active</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
          </div>
          <div className="mt-3 text-3xl font-black text-emerald-600 dark:text-emerald-400">{registeredTenants.length}</div>
          <div className="mt-1 text-xs text-slate-500">Passed production gating</div>
        </div>

        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5 shadow-sm">
          <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 text-xs font-semibold uppercase">
            <span>Gated / Incomplete</span>
            <AlertTriangle className="h-4 w-4 text-amber-500 dark:text-amber-400" />
          </div>
          <div className="mt-3 text-3xl font-black text-amber-600 dark:text-amber-400">{gatedTenants.length}</div>
          <div className="mt-1 text-xs text-slate-500">Dispatches strictly blocked</div>
        </div>

        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-5 shadow-sm">
          <div className="flex items-center justify-between text-rose-600 dark:text-rose-400 text-xs font-semibold uppercase">
            <span>Pending UTR Matches</span>
            <Clock className="h-4 w-4 text-rose-500 dark:text-rose-400" />
          </div>
          <div className="mt-3 text-3xl font-black text-rose-600 dark:text-rose-400">{pendingReconciliations.length}</div>
          <div className="mt-1 text-xs text-slate-500">Requires OCR verification</div>
        </div>
      </div>

      {/* Quick Action Navigation */}
      <div className="grid gap-6 md:grid-cols-3">
        <Link
          href="/admin/tenants"
          className="group rounded-2xl border border-slate-200 bg-white hover:border-sky-500/50 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900/50 dark:hover:border-sky-500/50 dark:hover:bg-slate-900 p-6 transition shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-500 dark:text-sky-400 flex items-center justify-center">
              <Users className="h-5 w-5" />
            </div>
            <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-sky-500 group-hover:translate-x-1 transition" />
          </div>
          <h2 className="font-bold text-slate-900 dark:text-white text-base mt-4">Customer &amp; Gating Directory</h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Manage business registration steps, free trials, plan tiers, and toggle tenant active states.
          </p>
        </Link>

        <Link
          href="/admin/reconciliations"
          className="group rounded-2xl border border-slate-200 bg-white hover:border-amber-500/50 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900/50 dark:hover:border-amber-500/50 dark:hover:bg-slate-900 p-6 transition shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 dark:text-amber-400 flex items-center justify-center">
              <Receipt className="h-5 w-5" />
            </div>
            <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-amber-500 group-hover:translate-x-1 transition" />
          </div>
          <h2 className="font-bold text-slate-900 dark:text-white text-base mt-4">UTR Screenshot Audit &amp; Overrides</h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Audit debtor bank payment screenshots, view extracted UTRs, and manually override settlements.
          </p>
        </Link>

        <Link
          href="/admin/broadcast"
          className="group rounded-2xl border border-slate-200 bg-white hover:border-emerald-500/50 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900/50 dark:hover:border-emerald-500/50 dark:hover:bg-slate-900 p-6 transition shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 flex items-center justify-center">
              <Activity className="h-5 w-5" />
            </div>
            <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-emerald-500 group-hover:translate-x-1 transition" />
          </div>
          <h2 className="font-bold text-slate-900 dark:text-white text-base mt-4">WhatsApp Platform Broadcast</h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Dispatch official updates, compliance advisories, and maintenance pings to registered tenant owners.
          </p>
        </Link>
      </div>

      {/* Recent Admin Audit Logs */}
      <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/60 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Activity className="h-4 w-4 text-rose-500 dark:text-rose-400" /> Recent Super-Admin Audit Log
          </h2>
          <span className="text-xs text-slate-500">Security &amp; Gating trail</span>
        </div>

        {auditLogs.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500">
            No admin actions logged yet. Platform activities will record here.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 dark:bg-slate-950/60 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-2.5 font-semibold">Timestamp</th>
                  <th className="px-4 py-2.5 font-semibold">Admin</th>
                  <th className="px-4 py-2.5 font-semibold">Action</th>
                  <th className="px-4 py-2.5 font-semibold">Target Tenant</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700 dark:divide-slate-800/60 dark:text-slate-300">
                {auditLogs.map((log: any) => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                    <td className="px-4 py-2.5 font-mono text-slate-500 dark:text-slate-400">
                      {new Date(log.created_at).toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-2.5">{log.admin_email}</td>
                    <td className="px-4 py-2.5 font-mono text-emerald-600 dark:text-emerald-400 font-medium">{log.action_type}</td>
                    <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400">{log.target_tenant_id || "Global"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
