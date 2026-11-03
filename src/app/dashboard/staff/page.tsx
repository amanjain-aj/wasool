import Link from "next/link";
import { getStore } from "@/lib/store";
import { StaffClient } from "./StaffClient";
import { ArrowLeft, Users } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

export const dynamic = "force-dynamic";

export default async function DashboardStaffPage({
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

  const staffList = await store.listStaff(selectedTenant.id);

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
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                Staff Numbers
              </span>
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

      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="h-6 w-6 text-sky-500 dark:text-sky-400" /> Dispatch Staff &amp; Munim Numbers
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Authorize dispatch boys, warehouse managers, and clerks to forward paper bills and delivery challans via WhatsApp.
          </p>
        </div>

        <StaffClient tenantId={selectedTenant.id} initialStaff={staffList} />
      </main>
    </div>
  );
}
