// POST /api/webhooks/razorpay — instant settlement reconciliation.
// Configure in Razorpay Dashboard → Webhooks with events:
//   payment_link.paid, payment.captured
// Attach the Wasool invoice id when creating the link/order:
//   notes: { wasool_invoice_id: "<uuid>" }   (or reference_id = "<uuid>" on Payment Links)
import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "@/lib/config";
import { errorResponse } from "@/lib/http";
import { settleInvoice } from "@/lib/services";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface RazorpayPayment {
  id: string;
  amount: number; // paise
  notes?: Record<string, string> | [];
  acquirer_data?: { rrn?: string; upi_transaction_id?: string };
}

interface RazorpayEvent {
  event: string;
  payload: {
    payment?: { entity: RazorpayPayment };
    payment_link?: { entity: { id: string; reference_id?: string; notes?: Record<string, string> | []; amount_paid?: number } };
  };
}

function verifySignature(raw: string, signature: string | null, secret: string) {
  if (!signature) return false;
  const expected = createHmac("sha256", secret).update(raw).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}

const noteId = (notes: Record<string, string> | [] | undefined) =>
  notes && !Array.isArray(notes) ? notes.wasool_invoice_id : undefined;

export async function POST(req: NextRequest) {
  try {
    const secret = env.razorpayWebhookSecret();
    if (!secret) return NextResponse.json({ error: "RAZORPAY_WEBHOOK_SECRET not configured" }, { status: 503 });

    const raw = await req.text();
    if (!verifySignature(raw, req.headers.get("x-razorpay-signature"), secret)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const evt = JSON.parse(raw) as RazorpayEvent;
    if (evt.event !== "payment_link.paid" && evt.event !== "payment.captured") {
      return NextResponse.json({ ignored: evt.event });
    }

    const payment = evt.payload.payment?.entity;
    const link = evt.payload.payment_link?.entity;
    const invoiceId = noteId(link?.notes) || link?.reference_id || noteId(payment?.notes);
    if (!invoiceId || !UUID_RE.test(invoiceId)) {
      return NextResponse.json({ ignored: "no wasool_invoice_id on payment" });
    }

    const utr = payment?.acquirer_data?.rrn || payment?.acquirer_data?.upi_transaction_id || payment?.id || link?.id;
    const amountPaise = payment?.amount ?? link?.amount_paid;
    const result = await settleInvoice(invoiceId, {
      utr_reference: utr,
      amount_paid: amountPaise != null ? amountPaise / 100 : null,
    });
    return NextResponse.json({ status: result.status, invoice_id: invoiceId, cancelled_reminders: result.cancelled_reminders });
  } catch (err) {
    return errorResponse(err);
  }
}
