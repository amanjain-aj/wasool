// app/page.tsx — Optimized for Mobile and Desktop with Light and Dark modes.
import React from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  Code2,
  FileSpreadsheet,
  FileText,
  HelpCircle,
  Lock,
  MessageSquareText,
  PhoneOff,
  Receipt,
  ShieldCheck,
  Smartphone,
  Table,
  UserCheck,
  Zap,
} from "lucide-react";
import { LiveMessagePreview } from "@/components/LiveMessagePreview";
import { LandingHeader } from "@/components/LandingHeader";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50 font-sans selection:bg-emerald-500 selection:text-slate-950 transition-colors duration-200">
      {/* Top Value Bar */}
      <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-3 sm:px-4 py-1.5 sm:py-2 text-center text-[11px] sm:text-xs text-emerald-700 dark:text-emerald-400 font-semibold tracking-wide leading-tight">
        🇮🇳 Built for Indian B2B Agencies, MSMEs &amp; Bookkeeping Platforms • Direct NPCI UPI Deep-Links
      </div>

      {/* Navbar with Responsive Mobile Drawer */}
      <LandingHeader />

      {/* Hero Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pt-10 sm:pt-16 md:pt-24 pb-12 sm:pb-16 text-center">
        <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1 sm:py-1.5 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] sm:text-xs text-slate-600 dark:text-slate-400 mb-5 sm:mb-6 shadow-sm">
          <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500 dark:text-emerald-400 shrink-0" />
          <span>Apka 24/7 Headless Digital Tagada Munshi on WhatsApp</span>
        </div>

        <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.2] mb-4 sm:mb-6 text-slate-900 dark:text-white">
          Apka 24/7 Digital Tagada Munshi on WhatsApp. <br className="hidden sm:inline" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500 dark:from-emerald-400 dark:to-teal-300">
            Forward a bill photo, PDF, or 5-second voice note.
          </span>
        </h1>

        <p className="text-base sm:text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed px-2">
          Wasool politely chases your client with proof-attached reminders and 1-tap UPI deep links until the money hits your bank account. Zero dashboard required.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center w-full max-w-md sm:max-w-none mx-auto">
          <Link
            href="/signup"
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl font-bold text-sm sm:text-base transition shadow-lg shadow-emerald-500/25 active:scale-[0.98]"
          >
            <span>Start Munshi Free (14-Day Pilot)</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <a
            href="#partner-api"
            className="w-full sm:w-auto px-5 sm:px-6 py-3.5 sm:py-4 rounded-xl border border-slate-300 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-sm sm:text-base font-semibold transition active:scale-[0.98] shadow-sm text-center"
          >
            Explore Embedded Partner API
          </a>
        </div>
      </section>

      {/* Unified Ingestion Matrix */}
      <section id="how-it-works" className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-20 border-t border-slate-200 dark:border-slate-900">
        <div className="text-center mb-10 sm:mb-14">
          <span className="text-[11px] sm:text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
            Works With Everything You Already Use
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-1">
            Zero App Download. Zero Excel Required.
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm mt-2 max-w-xl mx-auto">
            Whether you use a paper diary, Khatabook, Vyapar, or Tally—just forward whatever you have on WhatsApp.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 rounded-2xl shadow-sm hover:border-emerald-500/50 transition">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1">Pure Offline</div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-1.5">Snap Photo of Udhaar Diary</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Take a quick photo of your handwritten bahi-khata. Vision AI extracts 10–20 client rows in one shot and queues diplomatic follow-ups.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 rounded-2xl shadow-sm hover:border-emerald-500/50 transition">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
              <UserCheck className="w-5 h-5" />
            </div>
            <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">On-the-Go Seth</div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-1.5">Share WhatsApp Contact Card</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Share the debtor&apos;s contact card directly in WhatsApp + voice note (&quot;45,000, 15 din&quot;). Wasool pairs the contact and schedules reminders.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 rounded-2xl shadow-sm hover:border-emerald-500/50 transition">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center mb-4">
              <Receipt className="w-5 h-5" />
            </div>
            <div className="text-[11px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider mb-1">Paper Bill Pad</div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-1.5">Snap Carbon-Copy Challan</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Snap a picture of the signed delivery challan or estimate slip. Wasool attaches the signed slip in every reminder header.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 rounded-2xl shadow-sm hover:border-emerald-500/50 transition">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-4">
              <Smartphone className="w-5 h-5" />
            </div>
            <div className="text-[11px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider mb-1">Khatabook / Vyapar</div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-1.5">Forward Ledger PDF Report</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Tap &quot;Share PDF on WhatsApp&quot; inside your bookkeeping app and forward to Wasool. Ingests all overdue parties with a 1-tap owner approval card.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 rounded-2xl shadow-sm hover:border-emerald-500/50 transition">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1">Tally / Excel</div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-1.5">Forward GST PDF or .xlsx</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Forward your CA&apos;s sales register or Tally invoice PDF directly in WhatsApp. Gemini AI parses all invoice lines without manual data entry.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 rounded-2xl shadow-sm hover:border-emerald-500/50 transition">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider mb-1">Delegated Staff</div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-1.5">Interactive Owner Approval</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Staff can submit bills via WhatsApp. You receive an interactive [✅ Start Munshi] [✏️ Edit] [❌ Cancel] card on your WhatsApp before anything sends.
            </p>
          </div>
        </div>
      </section>

      {/* Core Value Grid */}
      <section id="features" className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-20 border-t border-slate-200 dark:border-slate-900">
        <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
          <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-5 sm:p-8 rounded-2xl shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4 sm:mb-5">
              <Zap className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-2">Forward &amp; Forget (Photo, PDF &amp; Voice)</h3>
            <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm leading-relaxed">
              Dispatch staff or owners simply WhatsApp a paper bill photo, PDF, or a Hinglish voice note (&quot;Sharma ji ko 15 din ka udhaar&quot;). Gemini AI auto-schedules the recovery.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-5 sm:p-8 rounded-2xl shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-teal-500/10 flex items-center justify-center mb-4 sm:mb-5">
              <Receipt className="w-6 h-6 text-teal-600 dark:text-teal-400" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-2">Proof-First Reminders</h3>
            <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm leading-relaxed">
              Every WhatsApp reminder attaches the original bill photo or PDF copy in the header. Eliminates the awkward &quot;Bill ki copy nahi mili&quot; delay tactic permanently.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-5 sm:p-8 rounded-2xl shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center mb-4 sm:mb-5">
              <PhoneOff className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-2">UTR Screenshot &amp; Reconciliation</h3>
            <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm leading-relaxed">
              When a buyer forwards a payment screenshot or cheque, Vision AI extracts the UTR, prompts the owner to confirm, and recalculates TDS/part-payment math automatically.
            </p>
          </div>
        </div>
      </section>

      {/* Interactive Previewer */}
      <section id="preview" className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-20 border-t border-slate-200 dark:border-slate-900">
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-2">
            <MessageSquareText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Interactive Simulator</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">See exactly what your client receives</h2>
          <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm mt-2">Type your details — the UPI deep link and WhatsApp template update instantly.</p>
        </div>
        <div className="bg-slate-100/70 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 rounded-2xl sm:rounded-3xl p-4 sm:p-8 md:p-10 shadow-sm">
          <LiveMessagePreview />
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-20 border-t border-slate-200 dark:border-slate-900">
        <div className="text-center mb-10 sm:mb-14">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">ROI-Guaranteed Indian B2B Pricing</h2>
          <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm mt-2 px-2">Recover a single delayed ₹25,000 bill and Wasool Munshi pays for itself for the entire year.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 sm:gap-8">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-8 flex flex-col justify-between shadow-sm hover:shadow-md transition">
            <div>
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Traders, Contractors &amp; MSMEs</span>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1">Munshi Standard</h3>
              <div className="mt-3 sm:mt-4 flex items-baseline text-slate-900 dark:text-white">
                <span className="text-3xl sm:text-4xl font-extrabold">₹999</span>
                <span className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm ml-2">/ month</span>
              </div>
              <ul className="mt-5 sm:mt-6 space-y-2.5 sm:space-y-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0" /> Up to 100 active credit bills/month</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0" /> Photo, PDF &amp; Voice Note WhatsApp Ingestion</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0" /> Original Bill Attachment in Template Header</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0" /> 09:30 AM Morning Tagada WhatsApp Digest</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0" /> 1-Tap Pause Debtor for 3 Days</li>
              </ul>
            </div>
            <Link href="/signup?plan=munshi_standard" className="mt-6 sm:mt-8 block text-center bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-white font-semibold py-3 sm:py-3.5 rounded-xl transition text-xs sm:text-sm">
              Start 14-Day Free Trial
            </Link>
          </div>

          <div className="bg-white dark:bg-slate-900 border-2 border-emerald-500/70 rounded-2xl p-5 sm:p-8 flex flex-col justify-between relative shadow-md">
            <span className="absolute -top-3 right-4 sm:right-6 bg-emerald-500 text-slate-950 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full shadow-sm">
              Most Popular
            </span>
            <div>
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Scaling Manufacturers &amp; Agencies</span>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1">Munshi Vyapar Pro</h3>
              <div className="mt-3 sm:mt-4 flex items-baseline text-slate-900 dark:text-white">
                <span className="text-3xl sm:text-4xl font-extrabold">₹2,499</span>
                <span className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm ml-2">/ month</span>
              </div>
              <ul className="mt-5 sm:mt-6 space-y-2.5 sm:space-y-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0" /> Up to 350 active credit bills/month</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0" /> Custom Branded Verified WhatsApp Sender ID</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0" /> Up to 5 Dispatch Staff / Clerk Phone numbers</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0" /> Interactive Owner Approval Card on WhatsApp</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0" /> Monthly CA-ready UTR &amp; TDS Excel Export</li>
              </ul>
            </div>
            <Link href="/signup?plan=munshi_vyapar_pro" className="mt-6 sm:mt-8 block text-center bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3 sm:py-3.5 rounded-xl transition text-xs sm:text-sm shadow-md shadow-emerald-500/20">
              Start 14-Day Free Trial
            </Link>
          </div>
        </div>
      </section>

      {/* 6-Question B2B FAQ */}
      <section id="faq" className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-20 border-t border-slate-200 dark:border-slate-900">
        <div className="text-center mb-10 sm:mb-14">
          <span className="text-[11px] sm:text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
            Frequently Asked Questions
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-1">
            Common Questions from Business Owners
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm mt-2">
            Everything you need to know about setting up Wasool Munshi for your business.
          </p>
        </div>

        <div className="space-y-3.5 sm:space-y-4">
          <details className="group bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 transition shadow-sm">
            <summary className="flex items-center justify-between font-bold text-slate-900 dark:text-white cursor-pointer list-none text-sm sm:text-base">
              <span className="pr-2">Mere clients bura toh nahi maanenge?</span>
              <ChevronDown className="w-5 h-5 text-slate-400 group-open:rotate-180 transition-transform shrink-0" />
            </summary>
            <p className="mt-3 sm:mt-4 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Bilkul nahi. Wasool uses diplomatic utility templates approved by Meta. Reminders arrive under your official business display name, polite and professional. It frames follow-ups around monthly ledger reconciliation and invoice records rather than aggressive recovery.
            </p>
          </details>

          <details className="group bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 transition shadow-sm">
            <summary className="flex items-center justify-between font-bold text-slate-900 dark:text-white cursor-pointer list-none text-sm sm:text-base">
              <span className="pr-2">Agar buyer ne part payment kiya ya TDS/kaat-chhaat kiya toh?</span>
              <ChevronDown className="w-5 h-5 text-slate-400 group-open:rotate-180 transition-transform shrink-0" />
            </summary>
            <p className="mt-3 sm:mt-4 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              When a buyer forwards a bank payment screenshot or cheque photo, Vision AI extracts the UTR number and amount. You receive an instant WhatsApp prompt: <code>[✅ Confirm Full]</code>, <code>[➗ Record Part-Payment]</code>, or <code>[❌ Not Received]</code>. On part-payment, Wasool recalculates the balance and updates the dynamic UPI link.
            </p>
          </details>

          <details className="group bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 transition shadow-sm">
            <summary className="flex items-center justify-between font-bold text-slate-900 dark:text-white cursor-pointer list-none text-sm sm:text-base">
              <span className="pr-2">Kya mujhe roz computer ya dashboard kholna padega?</span>
              <ChevronDown className="w-5 h-5 text-slate-400 group-open:rotate-180 transition-transform shrink-0" />
            </summary>
            <p className="mt-3 sm:mt-4 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Bilkul nahi. Wasool v2.1 is 100% headless on WhatsApp. You receive a daily 9:30 AM Tagada summary, approve bills, track recoveries, and hold reminders right from your phone. The web dashboard is optional for CA reporting.
            </p>
          </details>

          <details className="group bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 transition shadow-sm">
            <summary className="flex items-center justify-between font-bold text-slate-900 dark:text-white cursor-pointer list-none text-sm sm:text-base">
              <span className="pr-2">Agar mere dispatch ladke ya munim ne galat bill bhej diya toh?</span>
              <ChevronDown className="w-5 h-5 text-slate-400 group-open:rotate-180 transition-transform shrink-0" />
            </summary>
            <p className="mt-3 sm:mt-4 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Staff submissions trigger an interactive Owner Approval Card on the business owner&apos;s WhatsApp with <code>[✅ Start Munshi]</code>, <code>[✏️ Edit]</code>, and <code>[❌ Cancel]</code>. Outbound reminders never dispatch until you tap approve.
            </p>
          </details>

          <details className="group bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 transition shadow-sm">
            <summary className="flex items-center justify-between font-bold text-slate-900 dark:text-white cursor-pointer list-none text-sm sm:text-base">
              <span className="pr-2">Main pehle se Khatabook ya Vyapar use kar raha hu, kya mujhe switch karna padega?</span>
              <ChevronDown className="w-5 h-5 text-slate-400 group-open:rotate-180 transition-transform shrink-0" />
            </summary>
            <p className="mt-3 sm:mt-4 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Nahi, switch karne ki koi zaroorat nahi hai. Simply tap &quot;Share PDF on WhatsApp&quot; inside Khatabook or Vyapar and forward the report to Wasool Munshi. It auto-extracts all overdue parties into automated follow-ups.
            </p>
          </details>

          <details className="group bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 transition shadow-sm">
            <summary className="flex items-center justify-between font-bold text-slate-900 dark:text-white cursor-pointer list-none text-sm sm:text-base">
              <span className="pr-2">Data security aur mere bank account ka access kis kiske paas hoga?</span>
              <ChevronDown className="w-5 h-5 text-slate-400 group-open:rotate-180 transition-transform shrink-0" />
            </summary>
            <p className="mt-3 sm:mt-4 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Wasool never holds your funds and never asks for your netbanking passwords or card details. Settlements go directly peer-to-peer (P2P) from the buyer&apos;s UPI app to your registered UPI VPA or bank account. All data is encrypted with enterprise 256-bit standards.
            </p>
          </details>
        </div>
      </section>

      {/* Embedded Partner API Section (Khatabook / Vyapar / Swipe) */}
      <section id="partner-api" className="max-w-5xl mx-auto px-4 sm:px-8 py-10 sm:py-16 mb-12 sm:mb-20 bg-slate-100 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl shadow-sm">
        <div className="grid md:grid-cols-2 gap-8 sm:gap-10 items-center">
          <div>
            <div className="inline-flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-widest mb-2">
              <Code2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Embedded B2B Infrastructure</span>
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
              Powering Ledger &amp; Billing Platforms (Khatabook, myBillBook, Swipe)
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm mt-3 leading-relaxed">
              Monetize your existing merchant base by offering <strong>&quot;Autopilot WhatsApp Collections&quot;</strong> inside your app. Integrate via two REST webhooks—we handle Meta template compliance, QStash cron queues, and UPI deep-link generation.
            </p>
            <div className="mt-5 sm:mt-6 flex flex-col sm:flex-row gap-3">
              <Link href="/partner-docs" className="bg-slate-900 text-white dark:bg-white dark:text-slate-950 px-5 py-2.5 rounded-lg text-xs sm:text-sm font-bold hover:opacity-90 transition shadow-sm text-center">
                View Partner API Docs
              </Link>
              <a href="mailto:partners@wasool.io" className="px-5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-transparent text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-semibold hover:border-slate-500 transition shadow-sm text-center">
                Book Partner Integration Call
              </a>
            </div>
          </div>
          <div className="bg-slate-900 dark:bg-slate-950 border border-slate-800 rounded-xl sm:rounded-2xl p-3.5 sm:p-5 font-mono text-[11px] sm:text-xs text-emerald-400 overflow-x-auto shadow-inner">
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

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-900 py-10 pb-24 sm:pb-10 text-center text-xs text-slate-500 max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mb-4 font-medium text-slate-600 dark:text-slate-400">
          <Link href="/privacy" className="hover:text-emerald-500 transition">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-emerald-500 transition">Terms of Service</Link>
          <Link href="/refund" className="hover:text-emerald-500 transition">Refund &amp; Cancellation</Link>
          <Link href="/contact" className="hover:text-emerald-500 transition">Contact &amp; Grievance</Link>
          <Link href="/partner-docs" className="hover:text-emerald-500 transition">Partner API</Link>
          <Link href="/dashboard" className="hover:text-emerald-500 transition">Merchant Portal</Link>
        </div>
        <p className="text-[11px] text-slate-500">
          © {new Date().getFullYear()} Wasool Technologies India Pvt Ltd. All rights reserved. • NPCI UPI &amp; Meta WhatsApp Cloud API Compliant.
        </p>
      </footer>

      {/* Mobile-Only Sticky Floating Quick Action Bar */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-4 py-2.5 flex items-center gap-2 shadow-2xl">
        <Link
          href="/signup"
          className="flex-1 btn-primary py-2.5 text-xs font-bold text-center flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/25"
        >
          <span>Start Free Pilot (14 Days)</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
        <Link
          href="/login"
          className="px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 transition shrink-0"
        >
          Sign In
        </Link>
      </div>
    </div>
  );
}
