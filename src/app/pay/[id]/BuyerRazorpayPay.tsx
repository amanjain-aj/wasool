"use client";

import { RazorpayCheckoutButton } from "@/components/RazorpayCheckoutButton";

interface BuyerRazorpayPayProps {
  invoiceId: string;
  amountInINR: number;
  debtorName?: string;
  debtorPhone?: string;
  invoiceNumber: string;
  brandName: string;
}

export function BuyerRazorpayPay({
  invoiceId,
  amountInINR,
  debtorName,
  debtorPhone,
  invoiceNumber,
  brandName,
}: BuyerRazorpayPayProps) {
  return (
    <div className="mt-3">
      <RazorpayCheckoutButton
        amountInINR={amountInINR}
        name={brandName}
        description={`Payment for Bill #${invoiceNumber}`}
        buttonText={`Pay ₹${amountInINR.toLocaleString("en-IN")} via Cards / NetBanking / EMI`}
        className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 py-3 text-xs font-semibold text-slate-800 dark:text-slate-200 transition-all shadow-sm"
        invoiceId={invoiceId}
        prefill={{
          name: debtorName || "",
          contact: debtorPhone || "",
        }}
        notes={{
          invoice_id: invoiceId,
          invoice_number: invoiceNumber,
          channel: "web_checkout",
        }}
        onSuccess={() => {
          window.location.reload();
        }}
      />
    </div>
  );
}
