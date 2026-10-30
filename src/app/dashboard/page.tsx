import Link from "next/link";
import { getStore } from "@/lib/store";
import { todayIST } from "@/lib/dates";
import { DashboardView } from "@/components/dashboard/DashboardView";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ tenant?: string }>;
}) {
  const { tenant: queryTenantId } = await searchParams;
  const store = getStore();
  const tenants = await store.listTenants();
  const selectedTenant = tenants.find((t) => t.id === queryTenantId) || tenants[0];

  const today = todayIST();
  const [invoices, recentDispatches] = await Promise.all([
    store.listInvoices(selectedTenant?.id),
    store.listRecentDispatches(25, selectedTenant?.id),
  ]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 selection:bg-emerald-500 selection:text-slate-950">
      {/* Top Navigation */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-xl font-black tracking-tight text-white">
              Wasool<span className="text-emerald-500">.io</span>
            </Link>
            <div className="hidden sm:flex items-center gap-4 text-xs font-medium text-slate-400">
              <span className="text-emerald-400 font-semibold">B2B Dashboard</span>
              <Link href="/partner-docs" className="hover:text-white transition">
                Partner API
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-1.5 rounded-full border border-slate-800 bg-slate-900 px-3 py-1 text-xs text-slate-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>10:30 AM IST Scheduler: Active</span>
            </div>
            <Link
              href="/"
              className="rounded-lg border border-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white hover:border-slate-700 transition"
            >
              Public Site
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-white">Accounts Receivable Recovery Engine</h1>
          <p className="text-sm text-slate-400 mt-1">
            Autonomous WhatsApp escalation state machine with instant 1-tap NPCI UPI deep links.
          </p>
        </div>

        {tenants.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-12 text-center">
            <h2 className="text-lg font-bold text-white">No tenants configured</h2>
            <p className="text-sm text-slate-400 mt-2">
              Sign up as a direct business or sync via the Embedded Partner API.
            </p>
            <Link href="/signup" className="btn-primary mt-6">
              Create First Tenant
            </Link>
          </div>
        ) : (
          <DashboardView
            tenants={tenants}
            initialTenantId={selectedTenant.id}
            invoices={invoices}
            recentDispatches={recentDispatches}
            today={today}
          />
        )}
      </main>
    </div>
  );
}
