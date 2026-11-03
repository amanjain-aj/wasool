import { getStore } from "@/lib/store";
import { BroadcastClient } from "./BroadcastClient";

export const dynamic = "force-dynamic";

export default async function AdminBroadcastPage() {
  const store = getStore();
  const tenants = await store.listTenants();
  const registeredCount = tenants.filter((t) => t.is_registered === true || t.is_active === true).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-white">Platform WhatsApp Broadcast</h1>
        <p className="text-sm text-slate-400 mt-1">
          Broadcast compliance notices, feature releases, and critical system advisories directly to registered tenant owners.
        </p>
      </div>

      <BroadcastClient registeredCount={registeredCount} />
    </div>
  );
}
