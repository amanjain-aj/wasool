"use client";

import { useState } from "react";
import { Loader2, CreditCard, ShieldCheck } from "lucide-react";

interface RazorpayCheckoutButtonProps {
  amountInINR: number;
  name?: string;
  description?: string;
  buttonText?: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  tenantId?: string;
  planTier?: string;
  invoiceId?: string;
  className?: string;
  onSuccess?: (data: any) => void;
  onError?: (err: string) => void;
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if ((window as any).Razorpay) return resolve(true);

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export function RazorpayCheckoutButton({
  amountInINR,
  name = "Wasool.io",
  description = "Wasool Munshi Subscription",
  buttonText,
  prefill,
  notes = {},
  tenantId,
  planTier,
  invoiceId,
  className = "btn-primary",
  onSuccess,
  onError,
}: RazorpayCheckoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleCheckout() {
    setLoading(true);
    setErrorMessage(null);

    try {
      // 1. Ensure Razorpay script is loaded
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error("Failed to load Razorpay checkout SDK. Please check your internet connection.");
      }

      // 2. Call backend to create Razorpay Order (amount in paise)
      const amountPaise = Math.round(amountInINR * 100);
      const res = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amountPaise,
          currency: "INR",
          notes: {
            ...notes,
            ...(tenantId ? { tenant_id: tenantId } : {}),
            ...(planTier ? { plan_tier: planTier } : {}),
            ...(invoiceId ? { invoice_id: invoiceId } : {}),
          },
        }),
      });

      const orderData = await res.json();
      if (!res.ok) {
        throw new Error(orderData.error || "Failed to initialize payment order");
      }

      const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
      if (!keyId) {
        throw new Error("Razorpay Key ID is not configured (NEXT_PUBLIC_RAZORPAY_KEY_ID)");
      }

      // 3. Open Razorpay Standard Checkout Modal
      const options = {
        key: keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name,
        description,
        order_id: orderData.order_id,
        prefill: {
          name: prefill?.name || "",
          email: prefill?.email || "",
          contact: prefill?.contact || "",
        },
        theme: {
          color: "#10b981", // Wasool emerald brand color
        },
        handler: async function (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) {
          try {
            // 4. Verify payment signature on backend
            const verifyRes = await fetch("/api/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                tenant_id: tenantId,
                plan_tier: planTier,
                invoice_id: invoiceId,
                amount: orderData.amount,
              }),
            });

            const verifyData = await verifyRes.json();
            if (!verifyRes.ok || !verifyData.success) {
              throw new Error(verifyData.error || "Payment signature verification failed");
            }

            if (onSuccess) {
              onSuccess(verifyData);
            } else {
              alert("Payment successful! Transaction ID: " + response.razorpay_payment_id);
              window.location.reload();
            }
          } catch (err: any) {
            const msg = err?.message || "Payment verification failed";
            setErrorMessage(msg);
            if (onError) onError(msg);
          }
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
          },
        },
      };

      const rzp = new (window as any).Razorpay(options);

      rzp.on("payment.failed", function (response: any) {
        const failureReason = response?.error?.description || "Payment failed or was declined by bank.";
        setErrorMessage(failureReason);
        if (onError) onError(failureReason);
        setLoading(false);
      });

      rzp.open();
    } catch (err: any) {
      const msg = err?.message || "An error occurred starting checkout";
      setErrorMessage(msg);
      if (onError) onError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="inline-block w-full sm:w-auto">
      <button
        type="button"
        onClick={handleCheckout}
        disabled={loading}
        className={`${className} inline-flex items-center justify-center gap-2`}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <CreditCard className="w-4 h-4" />
        )}
        <span>{buttonText || `Pay ₹${amountInINR.toLocaleString("en-IN")}`}</span>
      </button>

      {errorMessage && (
        <p className="mt-1 text-xs text-rose-500 font-medium">{errorMessage}</p>
      )}
    </div>
  );
}
