import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import { errorResponse, readJson } from "@/lib/http";
import { settleInvoice } from "@/lib/services";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { status, notes } = await readJson<{ status: "CONFIRMED" | "REJECTED"; notes?: string }>(req);
    const store = getStore();

    await store.overrideReconciliation(id, status, notes);

    const rec = await store.getReconciliation(id);
    if (rec && status === "CONFIRMED") {
      await settleInvoice(rec.invoice_id, {
        utr_reference: rec.utr_or_cheque_number || "ADMIN_MANUAL_OVERRIDE",
        amount_paid: rec.reported_amount_inr,
      });
    }

    await store.logAdminAction("superadmin@wasool.io", "OVERRIDE_RECONCILIATION", rec?.invoice_id, {
      reconciliation_id: id,
      status,
      notes,
    });

    return NextResponse.json({ ok: true, status });
  } catch (err) {
    return errorResponse(err);
  }
}
