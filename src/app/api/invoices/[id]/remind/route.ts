// POST /api/invoices/:id/remind — "Trigger WhatsApp Now"
import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/http";
import { sendReminderNow } from "@/lib/dispatch";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    return NextResponse.json(await sendReminderNow(id));
  } catch (err) {
    return errorResponse(err);
  }
}
