import Link from "next/link";
import { getStore } from "@/lib/store";
import { SettingsClient } from "./SettingsClient";
import { ArrowLeft, Settings } from "lucide-react";

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
      <div className="max-w-2xl mx-auto py-12 text-center text-slate-400">
        No business tenant found. Please sign up first.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <Settings className="h-6 w-6 text-emerald-400" /> Collection &amp; Bank Settings
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Configure your UPI VPA, Bank NEFT details, and business branding for automated WhatsApp follow-ups.
          </p>
        </div>
        <Link
          href={`/dashboard?tenant=${selectedTenant.id}`}
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Dashboard
        </Link>
      </div>

      <SettingsClient tenant={selectedTenant} />
    </div>
  );
}
