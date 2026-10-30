// PATCH /api/invoices/:id — toggle autopilot, mark disputed / cancelled / reopen
import { NextRequest, NextResponse } from "next/server";
import type { InvoiceStatus } from "@/types/wasool";
import { errorResponse, HttpError, readJson } from "@/lib/http";
import { getStore } from "@/lib/store";
import { rescheduleInvoice } from "@/lib/services";

const SETTABLE: InvoiceStatus[] = ["PENDING", "DISPUTED", "CANCELLED"];

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await readJson<{ autopilot_enabled?: boolean; status?: InvoiceStatus }>(req);
    const store = getStore();
    const current = await store.getInvoice(id);
    if (!current) throw new HttpError(404, "Invoice not found");

    const patch: { autopilot_enabled?: boolean; status?: InvoiceStatus } = {};
    if (typeof body.autopilot_enabled === "boolean") patch.autopilot_enabled = body.autopilot_enabled;
    if (body.status) {
      if (!SETTABLE.includes(body.status)) throw new HttpError(422, `status must be one of ${SETTABLE.join(", ")} (use /settle for payments)`);
      if (current.status === "PAID") throw new HttpError(409, "Paid invoices cannot change status");
      patch.status = body.status === "PENDING" && current.amount_pending_inr < current.amount_total_inr ? "PARTIALLY_PAID" : body.status;
    }
    if (!Object.keys(patch).length) throw new HttpError(422, "Nothing to update");

    const updated = await store.updateInvoice(id, patch);
    const scheduled = await rescheduleInvoice(updated);
    return NextResponse.json({ invoice: updated, reminders: scheduled });
  } catch (err) {
    return errorResponse(err);
  }
}
