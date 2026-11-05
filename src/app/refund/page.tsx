import React from "react";
import Link from "next/link";
import { RefreshCw, ArrowLeft, CheckCircle2 } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";

export const metadata = {
  title: "Cancellation & Refund Policy — Wasool.io",
  description: "Transparent 7-Day Money-Back Guarantee and Cancellation Policy for Wasool.io SaaS Subscriptions.",
};

export default function RefundPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50 font-sans">
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <BrandLogo size="sm" />
          <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-emerald-500 transition">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Home</span>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 sm:p-12 shadow-xl space-y-8">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold mb-3">
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Razorpay KYC Compliant</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Cancellation &amp; Refund Policy</h1>
            <p className="text-xs text-slate-500 mt-2">Effective Date: November 1, 2026 • Last Updated: November 2026</p>
          </div>

          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5 text-sm text-emerald-800 dark:text-emerald-300 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
            <div>
              <strong className="font-semibold block mb-1">7-Day No-Questions-Asked Money-Back Guarantee</strong>
              <span>If you upgrade to any paid Wasool Munshi subscription and are not 100% satisfied with our collection automation, request a full refund within 7 calendar days of your payment date.</span>
            </div>
          </div>

          <section className="space-y-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">1. SaaS Subscription Cancellation</h2>
            <p>
              Merchants can cancel their recurring Wasool SaaS subscription at any time directly through the <strong>Dashboard → Settings</strong> panel or by emailing <code>support@wasool.io</code>. Upon cancellation, your account will remain active until the end of your prepaid billing period, with zero future auto-debits.
            </p>
          </section>

          <section className="space-y-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">2. Refund Eligibility &amp; Timeline</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Initial Subscriptions:</strong> Eligible for a 100% refund if requested within 7 days of the first transaction date.</li>
              <li><strong>Subsequent Monthly Renewals:</strong> Renewal payments are non-refundable once the monthly billing cycle has commenced, but cancellation takes effect immediately for all subsequent billing cycles.</li>
              <li><strong>Processing Time:</strong> Approved refunds are initiated immediately via our payment aggregator (Razorpay) and credit back to the customer&apos;s original payment method (Bank Account / UPI / Card) within <strong>5 to 7 business banking days</strong>.</li>
            </ul>
          </section>

          <section className="space-y-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">3. Debtor Invoice Payments (Zero Custody)</h2>
            <p>
              Payments made by buyers/debtors towards their commercial invoices via UPI deep links or Razorpay checkout go directly to the merchant&apos;s bank account. Because Wasool does not hold or escrow invoice settlements, any disputes or chargebacks regarding the underlying goods or services must be resolved directly between the buyer and the seller.
            </p>
          </section>

          <section className="space-y-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">4. How to Request a Refund</h2>
            <p>
              To claim a refund under the 7-day policy, send an email to <code>refunds@wasool.io</code> with:
            </p>
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 bg-slate-50 dark:bg-slate-950 font-mono text-xs space-y-1">
              <div>• Registered Business Name &amp; Email</div>
              <div>• Razorpay Payment ID (e.g. <code>pay_...</code>) or Invoice Date</div>
              <div>• Brief reason for cancellation (optional, helps us improve)</div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
