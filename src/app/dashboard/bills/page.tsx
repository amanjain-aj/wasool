import Link from "next/link";
import { getStore } from "@/lib/store";
import { todayIST } from "@/lib/dates";
import { BillsClient } from "./BillsClient";
import { ArrowLeft, Receipt } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

export const dynamic = "force-dynamic";

export default async function DashboardBillsPage({
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
    return <div className="p-8 text-center text-slate-500">Tenant not found.</div>;
  }

  const invoices = await store.listInvoices(selectedTenant.id);
  const today = todayIST();

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
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                Bills Ledger
              </span>
              <Link href={`/dashboard/staff?tenant=${selectedTenant.id}`} className="hover:text-slate-900 dark:hover:text-white transition">
                Staff Numbers
              </Link>
              <Link href={`/dashboard/settings?tenant=${selectedTenant.id}`} className="hover:text-slate-900 dark:hover:text-white transition">
                Settings &amp; Bank
              </Link>
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

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Receipt className="h-6 w-6 text-emerald-500 dark:text-emerald-400" /> Ingested Bills &amp; Ledger Audit
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Desktop view of all single bills, handwritten diary pages, and bulk Khatabook imports with attached original proofs.
          </p>
        </div>

        <BillsClient invoices={invoices} today={today} />
      </main>
    </div>
  );
}
