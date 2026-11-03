import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "@/lib/config";
import { getStore } from "@/lib/store";
import { settleInvoice } from "@/lib/services";

export async function POST(req: NextRequest) {
  try {
    const key_secret = env.razorpayKeySecret();
    if (!key_secret) {
      return NextResponse.json(
        { error: "Razorpay secret (RAZORPAY_KEY_SECRET) not configured on server" },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      invoice_id,
      tenant_id,
      plan_tier,
      amount,
    } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: "Missing required payment fields: razorpay_order_id, razorpay_payment_id, and razorpay_signature are required." },
        { status: 400 }
      );
    }

    // Verify HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET)
    const data = `${razorpay_order_id}|${razorpay_payment_id}`;
    const generated_signature = createHmac("sha256", key_secret)
      .update(data)
      .digest("hex");

    const a = Buffer.from(generated_signature);
    const b = Buffer.from(razorpay_signature);

    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      return NextResponse.json(
        { success: false, error: "Invalid payment signature: verification failed" },
        { status: 400 }
      );
    }

    // Post-payment actions:
    let invoiceSettlement = null;
    if (invoice_id) {
      try {
        const amtRupees = typeof amount === "number" ? amount / 100 : undefined;
        invoiceSettlement = await settleInvoice(invoice_id, {
          utr_reference: razorpay_payment_id,
          amount_paid: amtRupees,
        });
      } catch (e) {
        console.error("[Invoice settlement after Razorpay verification error]", e);
      }
    }

    if (tenant_id && plan_tier) {
      try {
        const store = getStore();
        await store.updateTenant(tenant_id, {
          subscription_plan: plan_tier,
          is_registered: true,
          registration_step: "COMPLETED",
        });
      } catch (e) {
        console.error("[Tenant plan update after Razorpay verification error]", e);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Payment verified successfully",
      payment_id: razorpay_payment_id,
      order_id: razorpay_order_id,
      settlement: invoiceSettlement,
    });
  } catch (err: any) {
    console.error("[Razorpay verify-payment error]", err);
    return NextResponse.json(
      { error: err?.message || "Failed to verify Razorpay payment" },
      { status: 500 }
    );
  }
}
