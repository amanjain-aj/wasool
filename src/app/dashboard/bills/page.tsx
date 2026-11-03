import Link from "next/link";
import { getStore } from "@/lib/store";
import { todayIST } from "@/lib/dates";
import { BillsClient } from "./BillsClient";
import { ArrowLeft, Receipt } from "lucide-react";

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
    return <div className="p-8 text-center text-slate-400">Tenant not found.</div>;
  }

  const invoices = await store.listInvoices(selectedTenant.id);
  const today = todayIST();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <Receipt className="h-6 w-6 text-emerald-400" /> Ingested Bills &amp; Ledger Audit
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Desktop view of all single bills, handwritten diary pages, and bulk Khatabook imports with attached original proofs.
          </p>
        </div>
        <Link
          href={`/dashboard?tenant=${selectedTenant.id}`}
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Dashboard
        </Link>
      </div>

      <BillsClient invoices={invoices} today={today} />
    </div>
  );
}
