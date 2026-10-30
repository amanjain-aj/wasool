// POST /api/invoices/:id/settle — 1-click "Mark as Paid" (records UTR)
import { NextRequest, NextResponse } from "next/server";
import { errorResponse, readJson } from "@/lib/http";
import { settleInvoice } from "@/lib/services";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await readJson<{ utr_reference?: string; amount_paid?: number | null }>(req);
    const result = await settleInvoice(id, { utr_reference: body.utr_reference, amount_paid: body.amount_paid ?? null });
    return NextResponse.json(result);
  } catch (err) {
    return errorResponse(err);
  }
}
