import Link from "next/link";
import { getStore } from "@/lib/store";
import { todayIST } from "@/lib/dates";
import { DashboardView } from "@/components/dashboard/DashboardView";
import { ThemeToggle } from "@/components/ThemeToggle";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: Promise<{ tenant?: string; setup?: string }>;
}) {
  let queryTenantId: string | undefined;
  let setup: string | undefined;

  try {
    const sp = searchParams ? await searchParams : {};
    queryTenantId = typeof sp?.tenant === "string" ? sp.tenant : undefined;
    setup = typeof sp?.setup === "string" ? sp.setup : undefined;
  } catch {
    /* fallback on searchParams resolution */
  }

  let tenants: any[] = [];
  let selectedTenant: any = null;
  let invoices: any[] = [];
  let recentDispatches: any[] = [];
  const today = todayIST();
  let loadError: string | null = null;
  const initialShowSetup = setup === "1";

  try {
    const store = getStore();
    const loadedTenants = await store.listTenants();
    tenants = Array.isArray(loadedTenants) ? loadedTenants : [];
    selectedTenant = (queryTenantId ? tenants.find((t) => t.id === queryTenantId) : null) || tenants[0] || null;

    if (selectedTenant?.id) {
      const [invList, dispList] = await Promise.all([
        store.listInvoices(selectedTenant.id).catch((err) => {
          console.error("[listInvoices error]", err);
          return [];
        }),
        store.listRecentDispatches(25, selectedTenant.id).catch((err) => {
          console.error("[listRecentDispatches error]", err);
          return [];
        }),
      ]);
      invoices = Array.isArray(invList) ? invList : [];
      recentDispatches = Array.isArray(dispList) ? dispList : [];
    }
  } catch (err) {
    console.error("[Dashboard Load Error]", err);
    loadError = err instanceof Error ? err.message : String(err);
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50 selection:bg-emerald-500 selection:text-slate-950">
      {/* Top Navigation */}
      <header className="border-b border-slate-200 bg-white/80 dark:border-slate-900 dark:bg-slate-950/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
              Wasool<span className="text-emerald-500">.io</span>
            </Link>
            <div className="hidden sm:flex items-center gap-4 text-xs font-medium text-slate-600 dark:text-slate-400">
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Overview</span>
              <Link href={selectedTenant ? `/dashboard/bills?tenant=${selectedTenant.id}` : "/dashboard/bills"} className="hover:text-slate-900 dark:hover:text-white transition">
                Bills Ledger
              </Link>
              <Link href={selectedTenant ? `/dashboard/staff?tenant=${selectedTenant.id}` : "/dashboard/staff"} className="hover:text-slate-900 dark:hover:text-white transition">
                Staff Numbers
              </Link>
              <Link href={selectedTenant ? `/dashboard/settings?tenant=${selectedTenant.id}` : "/dashboard/settings"} className="hover:text-slate-900 dark:hover:text-white transition">
                Settings &amp; Bank
              </Link>
              <Link href="/admin" className="text-rose-500 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300 font-semibold transition">
                Admin Panel
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>10:30 AM IST Scheduler: Active</span>
            </div>
            <Link
              href="/"
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:text-white dark:hover:border-slate-700 transition"
            >
              Public Site
            </Link>
            <Link
              href="/login"
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:text-white dark:hover:border-slate-700 transition"
            >
              Switch Account
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Accounts Receivable Recovery Engine</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Autonomous WhatsApp escalation state machine with instant 1-tap NPCI UPI deep links.
          </p>
        </div>

        {loadError ? (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-8 text-center text-rose-600 dark:text-rose-300">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Database Connection Notice</h2>
            <p className="text-sm max-w-xl mx-auto text-rose-600 dark:text-rose-200">
              Failed to connect to configured Supabase database: {loadError}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-4">
              If you haven&apos;t run the SQL schema yet, open Supabase SQL Editor and execute <code>supabase/schema.sql</code>.
            </p>
          </div>
        ) : tenants.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/60 p-12 text-center">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">No tenants configured</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
              Sign up as a direct business or sync via the Embedded Partner API.
            </p>
            <Link href="/signup" className="btn-primary mt-6">
              Create First Tenant
            </Link>
          </div>
        ) : (
          <DashboardView
            tenants={tenants}
            initialTenantId={selectedTenant?.id || ""}
            invoices={invoices}
            recentDispatches={recentDispatches}
            today={today}
            initialShowSetup={initialShowSetup}
          />
        )}
      </main>
    </div>
  );
}
