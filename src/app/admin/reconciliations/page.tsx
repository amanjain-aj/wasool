import { getStore } from "@/lib/store";
import { ReconciliationsClient } from "./ReconciliationsClient";

export const dynamic = "force-dynamic";

export default async function AdminReconciliationsPage() {
  const store = getStore();
  const reconciliations = await store.listAllReconciliations();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-white">UTR Screenshot Audit &amp; Settlement Overrides</h1>
        <p className="text-sm text-slate-400 mt-1">
          Review debtor bank payment screenshots, view Vision AI extracted UTRs, and manually override invoice settlement states.
        </p>
      </div>

      <ReconciliationsClient initialReconciliations={reconciliations} />
    </div>
  );
}
