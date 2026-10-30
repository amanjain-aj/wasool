// app/page.tsx — Blueprint §7, plus an interactive UPI / WhatsApp previewer section.
import React from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, ShieldCheck, Zap, Receipt, PhoneOff, Code2, MessageSquareText } from "lucide-react";
import { LiveMessagePreview } from "@/components/LiveMessagePreview";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* Top Value Bar */}
      <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-4 py-2 text-center text-xs text-emerald-400 font-medium">
        🇮🇳 Built for Indian B2B Agencies, MSMEs &amp; Bookkeeping Platforms • Direct NPCI UPI Deep-Links
      </div>

      {/* Navbar */}
      <header className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
        <div className="text-2xl font-black tracking-tight text-white">
          Wasool<span className="text-emerald-500">.io</span>
        </div>
        <nav className="hidden md:flex space-x-8 text-sm text-slate-400 font-medium">
          <a href="#features" className="hover:text-white transition">Features</a>
          <a href="#preview" className="hover:text-white transition">Live Preview</a>
          <a href="#pricing" className="hover:text-white transition">Pricing (INR)</a>
          <a href="#partner-api" className="hover:text-white transition">Partner API (Khatabook/ERP)</a>
        </nav>
        <Link
          href="/dashboard"
          className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 py-2 rounded-lg text-sm font-bold transition"
        >
          Start 14-Day Free Pilot
        </Link>
      </header>

      {/* Hero Section */}
      <section className="max-w-4xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-400 mb-6">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>100% Meta Official WhatsApp Business API Compliant</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-[1.15] mb-6">
          Stop begging clients to clear their invoices. <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
            Put WhatsApp recovery on autopilot.
          </span>
        </h1>

        <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          Wasool sends polite, audit-framed WhatsApp reminders with 1-tap UPI intent links. Recover your stuck working capital 2.5x faster without awkward phone calls.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            href="/dashboard"
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-8 py-4 rounded-xl font-bold text-base transition shadow-lg shadow-emerald-500/20"
          >
            <span>Upload Overdue Excel / Connect Zoho</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <a
            href="#partner-api"
            className="w-full sm:w-auto px-6 py-4 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900 text-slate-300 text-base font-semibold transition"
          >
            Explore Embedded Partner API
          </a>
        </div>
      </section>

      {/* Core Value Grid */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-20 border-t border-slate-900">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-2xl">
            <Zap className="w-8 h-8 text-emerald-400 mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">1-Tap UPI Deep Links</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Bypass the 30-minute NEFT beneficiary cooling period. Clients tap once on WhatsApp to open GPay, PhonePe, or Paytm with your exact invoice amount pre-filled.
            </p>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-2xl">
            <Receipt className="w-8 h-8 text-teal-400 mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">Diplomatic Audit Framing</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Protect your client relationships. Messages are written as routine &quot;monthly ledger reconciliations&quot; from your accounts desk—never rude debt collection threats.
            </p>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-2xl">
            <PhoneOff className="w-8 h-8 text-cyan-400 mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">Zero Manual Chasing</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Automatically escalates from T-2 courtesy notices to T+15 formal holds at 10:30 AM IST. Halts the exact second payment or UTR is recorded.
            </p>
          </div>
        </div>
      </section>

      {/* Interactive Previewer */}
      <section id="preview" className="max-w-6xl mx-auto px-6 py-20 border-t border-slate-900">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-widest mb-2">
            <MessageSquareText className="w-4 h-4" />
            <span>Try it live</span>
          </div>
          <h2 className="text-3xl font-bold text-white">See exactly what your client receives</h2>
          <p className="text-slate-400 text-sm mt-2">Type your details — the UPI deep link and WhatsApp template update instantly.</p>
        </div>
        <LiveMessagePreview />
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="max-w-4xl mx-auto px-6 py-20 border-t border-slate-900">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold text-white">ROI-Guaranteed INR Pricing</h2>
          <p className="text-slate-400 text-sm mt-2">Recover a single delayed ₹25,000 invoice and Wasool pays for itself for the entire year.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Service Agencies &amp; MSMEs</span>
              <h3 className="text-2xl font-bold text-white mt-1">Starter</h3>
              <div className="mt-4 flex items-baseline text-white">
                <span className="text-4xl font-extrabold">₹1,499</span>
                <span className="text-slate-400 text-sm ml-2">/ month</span>
              </div>
              <ul className="mt-6 space-y-3 text-sm text-slate-300">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Up to 100 active invoices/month</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> 5-stage WhatsApp escalation workflow</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Dynamic UPI QR &amp; Intent links</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> CSV / Excel upload &amp; Razorpay sync</li>
              </ul>
            </div>
            <Link href="/signup?plan=starter" className="mt-8 block text-center bg-slate-800 hover:bg-slate-700 text-white font-semibold py-3 rounded-xl transition text-sm">
              Start 14-Day Free Trial
            </Link>
          </div>

          <div className="bg-slate-900 border-2 border-emerald-500/60 rounded-2xl p-8 flex flex-col justify-between relative">
            <span className="absolute -top-3 right-6 bg-emerald-500 text-slate-950 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full">
              Most Popular
            </span>
            <div>
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Scaling Enterprises</span>
              <h3 className="text-2xl font-bold text-white mt-1">Growth</h3>
              <div className="mt-4 flex items-baseline text-white">
                <span className="text-4xl font-extrabold">₹3,999</span>
                <span className="text-slate-400 text-sm ml-2">/ month</span>
              </div>
              <ul className="mt-6 space-y-3 text-sm text-slate-300">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Up to 400 active invoices/month</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> 2-Way Zoho Books &amp; Tally Connector</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Custom Verified WhatsApp Brand Name</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Automated UTR Screenshot Parser</li>
              </ul>
            </div>
            <Link href="/signup?plan=growth" className="mt-8 block text-center bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3 rounded-xl transition text-sm">
              Start 14-Day Free Trial
            </Link>
          </div>
        </div>
      </section>

      {/* Embedded Partner API Section (Khatabook / Vyapar / Swipe) */}
      <section id="partner-api" className="max-w-5xl mx-auto px-6 py-16 mb-20 bg-slate-900/70 border border-slate-800 rounded-3xl">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold text-teal-400 uppercase tracking-widest mb-2">
              <Code2 className="w-4 h-4" />
              <span>Embedded B2B Infrastructure</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-white">
              Powering Ledger &amp; Billing Platforms (Khatabook, myBillBook, Swipe)
            </h2>
            <p className="text-slate-400 text-sm mt-3 leading-relaxed">
              Monetize your existing merchant base by offering <strong>&quot;Autopilot WhatsApp Collections&quot;</strong> inside your app. Integrate via two REST webhooks—we handle Meta template compliance, QStash cron queues, and UPI deep-link generation.
            </p>
            <div className="mt-6 flex gap-4">
              <Link href="/partner-docs" className="bg-white text-slate-950 px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-slate-200 transition">
                View Partner API Docs
              </Link>
              <a href="mailto:partners@wasool.io" className="px-5 py-2.5 rounded-lg border border-slate-700 text-slate-300 text-sm font-semibold hover:border-slate-500 transition">
                Book Partner Integration Call
              </a>
            </div>
          </div>
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs text-emerald-400 overflow-x-auto">
            <div className="text-slate-500 mb-2">// POST /api/v1/partner/invoices/sync</div>
            <pre>{`{
  "partner_id": "khatabook",
  "merchant": {
    "id": "kb_99281",
    "business_name": "Sharma Traders",
    "upi_vpa": "sharmatraders@hdfcbank"
  },
  "debtor": {
    "name": "Metro Retail Pvt Ltd",
    "phone": "+919820112233"
  },
  "invoice": {
    "number": "INV-2026-884",
    "amount_pending": 64200.00,
    "due_date": "2026-11-15"
  }
}`}</pre>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-900 py-8 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} Wasool.io • Made for Indian B2B •{" "}
        <Link href="/partner-docs" className="hover:text-slate-300">Partner API</Link> •{" "}
        <Link href="/dashboard" className="hover:text-slate-300">Dashboard</Link>
      </footer>
    </div>
  );
}
