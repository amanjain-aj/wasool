import { getStore } from "@/lib/store";
import { TenantsClient } from "./TenantsClient";

export const dynamic = "force-dynamic";

export default async function AdminTenantsPage() {
  const store = getStore();
  const tenants = await store.listTenants();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-white">Customer Directory &amp; Production Gating</h1>
        <p className="text-sm text-slate-400 mt-1">
          Monitor all onboarded MSME businesses, toggle strict production dispatch gating, and update subscription tiers.
        </p>
      </div>

      <TenantsClient initialTenants={tenants} />
    </div>
  );
}
