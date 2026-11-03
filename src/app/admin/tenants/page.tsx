import { getStore } from "@/lib/store";
import { getTenantUsage } from "@/lib/quota";
import { TenantsClient } from "./TenantsClient";

export const dynamic = "force-dynamic";

export default async function AdminTenantsPage() {
  const store = getStore();
  const tenants = await store.listTenants();

  const tenantsWithUsage = await Promise.all(
    tenants.map(async (t) => {
      try {
        const usage = await getTenantUsage(t.id);
        return { ...t, usage };
      } catch {
        return { ...t, usage: null };
      }
    })
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-white">Customer Directory &amp; Production Gating</h1>
        <p className="text-sm text-slate-400 mt-1">
          Monitor all onboarded MSME businesses, track usage vs monthly bill quotas, and toggle strict production dispatch gating.
        </p>
      </div>

      <TenantsClient initialTenants={tenantsWithUsage as any} />
    </div>
  );
}
