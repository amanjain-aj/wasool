import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import { env } from "@/lib/config";

export async function POST(req: NextRequest) {
  try {
    const key_id = env.razorpayKeyId();
    const key_secret = env.razorpayKeySecret();

    if (!key_id || !key_secret) {
      return NextResponse.json(
        { error: "Razorpay credentials (RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET) not configured" },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { currency = "INR", receipt, notes = {} } = body;
    let amount = body.amount;

    if (typeof amount === "string") {
      amount = Number(amount);
    }

    if (!amount || isNaN(amount) || amount < 100) {
      return NextResponse.json(
        { error: "Invalid amount: must be an integer of at least 100 paise (₹1.00)" },
        { status: 400 }
      );
    }

    const razorpay = new Razorpay({
      key_id,
      key_secret,
    });

    const receiptId = receipt || `rcpt_${Date.now().toString(36)}`;

    const order = await razorpay.orders.create({
      amount: Math.round(amount),
      currency: currency.toUpperCase(),
      receipt: String(receiptId).slice(0, 40),
      notes: typeof notes === "object" && notes !== null ? notes : {},
    });

    return NextResponse.json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
    });
  } catch (err: any) {
    console.error("[Razorpay create-order error]", err);
    const statusCode = err?.statusCode || (err?.error?.code === "BAD_REQUEST_ERROR" ? 400 : 500);
    return NextResponse.json(
      { error: err?.error?.description || err?.message || "Failed to create Razorpay order" },
      { status: statusCode }
    );
  }
}
