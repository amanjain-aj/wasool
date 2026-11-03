import Link from "next/link";
import { getStore } from "@/lib/store";
import { SettingsClient } from "./SettingsClient";
import { ArrowLeft, Settings } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

export const dynamic = "force-dynamic";

export default async function DashboardSettingsPage({
  searchParams,
}: {
  searchParams?: Promise<{ tenant?: string }>;
}) {
  let queryTenantId: string | undefined;
  try {
    const sp = searchParams ? await searchParams : {};
    queryTenantId = typeof sp?.tenant === "string" ? sp.tenant : undefined;
  } catch {
    /* fallback */
  }

  const store = getStore();
  const tenants = await store.listTenants();
  const selectedTenant = (queryTenantId ? tenants.find((t) => t.id === queryTenantId) : null) || tenants[0];

  if (!selectedTenant) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center text-slate-500">
        No business tenant found. Please sign up first.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
      {/* Top Navigation */}
      <header className="border-b border-slate-200 bg-white/80 dark:border-slate-900 dark:bg-slate-950/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
              Wasool<span className="text-emerald-500">.io</span>
            </Link>
            <div className="hidden sm:flex items-center gap-4 text-xs font-medium text-slate-600 dark:text-slate-400">
              <Link href={`/dashboard?tenant=${selectedTenant.id}`} className="hover:text-slate-900 dark:hover:text-white transition">
                Overview
              </Link>
              <Link href={`/dashboard/bills?tenant=${selectedTenant.id}`} className="hover:text-slate-900 dark:hover:text-white transition">
                Bills Ledger
              </Link>
              <Link href={`/dashboard/staff?tenant=${selectedTenant.id}`} className="hover:text-slate-900 dark:hover:text-white transition">
                Staff Numbers
              </Link>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                Settings &amp; Bank
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href={`/dashboard?tenant=${selectedTenant.id}`}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white px-3 py-1.5 rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 transition"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Dashboard
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Settings className="h-6 w-6 text-emerald-500 dark:text-emerald-400" /> Collection &amp; Bank Settings
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Configure your UPI VPA, Bank NEFT details, and business branding for automated WhatsApp follow-ups.
          </p>
        </div>

        <SettingsClient tenant={selectedTenant} />
      </main>
    </div>
  );
}
