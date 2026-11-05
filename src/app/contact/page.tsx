import React from "react";
import Link from "next/link";
import { Mail, Phone, MapPin, ShieldCheck, ArrowLeft, Clock } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";

export const metadata = {
  title: "Contact Us & Grievance Redressal — Wasool.io",
  description: "Get in touch with Wasool.io customer support and statutory Grievance Officer under IT Rules 2021.",
};

export default function ContactPage() {
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
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Official Support &amp; Statutory Redressal</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Contact Us</h1>
            <p className="text-xs text-slate-500 mt-2">We are here to assist with billing, onboarding, partner APIs, or statutory inquiries.</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-6 bg-slate-50/50 dark:bg-slate-950/40 space-y-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <Mail className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Customer Support</h3>
              <p className="text-xs text-slate-500">For onboarding assistance, bug reports, and plan upgrades.</p>
              <div className="font-mono text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                support@wasool.io
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-6 bg-slate-50/50 dark:bg-slate-950/40 space-y-3">
              <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-500 flex items-center justify-center">
                <Phone className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">WhatsApp Helpline</h3>
              <p className="text-xs text-slate-500">Live chat support for active Munshi merchants.</p>
              <div className="font-mono text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                +91 98200 11223 (Mon–Sat, 9:30 AM – 6:30 PM IST)
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-6 bg-white dark:bg-slate-900/60 space-y-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-500" />
              <span>Registered Business Address</span>
            </h2>
            <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-mono">
              Wasool Technologies India Pvt Ltd<br />
              Level 4, Dynasty Business Park, Andheri-Kurla Road,<br />
              Andheri (East), Mumbai, Maharashtra 400059, India
            </div>
          </div>

          {/* Statutory Grievance Redressal Mechanism */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-6 bg-slate-50 dark:bg-slate-950/80 space-y-4">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-base">
              <Clock className="w-4 h-4 text-amber-500" />
              <span>Statutory Grievance Officer (IT Rules, 2021)</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              In accordance with Rule 3(2) of the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021, and the Consumer Protection (E-Commerce) Rules, 2020:
            </p>
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 bg-white dark:bg-slate-900 text-xs font-mono space-y-1.5">
              <div><strong>Officer:</strong> Grievance Redressal Officer</div>
              <div><strong>Email:</strong> grievance@wasool.io</div>
              <div><strong>Resolution Timeline:</strong> Acknowledgment within 24 hours; resolution within 15 days.</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
