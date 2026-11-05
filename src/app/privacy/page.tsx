import React from "react";
import Link from "next/link";
import { ShieldCheck, ArrowLeft } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";

export const metadata = {
  title: "Privacy Policy — Wasool.io",
  description: "Privacy Policy and Data Protection practices of Wasool.io under the Digital Personal Data Protection Act (DPDP Act, 2023).",
};

export default function PrivacyPage() {
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
              <span>DPDP Act (2023) Compliant</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Privacy Policy</h1>
            <p className="text-xs text-slate-500 mt-2">Effective Date: November 1, 2026 • Last Updated: November 2026</p>
          </div>

          <section className="space-y-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">1. Introduction &amp; Scope</h2>
            <p>
              Wasool.io (&quot;Wasool&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) provides a cloud-based automated accounts receivable communication and payment notification SaaS platform. This Privacy Policy outlines our standards for collecting, processing, storing, and protecting personal and financial data in compliance with India&apos;s Digital Personal Data Protection Act, 2023 (DPDP Act) and the Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011.
            </p>
          </section>

          <section className="space-y-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">2. Data We Collect</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Merchant Business Information:</strong> Legal business name, brand name, registered email, mobile number, GSTIN, and business address.</li>
              <li><strong>Banking &amp; Settlement Identifiers:</strong> Bank account numbers, IFSC codes, and Virtual Payment Addresses (UPI VPAs) provided for 1-tap customer payments. (Wasool does not store payment card CVVs or net banking passwords).</li>
              <li><strong>Debtor &amp; Transaction Details:</strong> Customer name, contact telephone number, invoice numbers, billing amounts, due dates, and proof documents (PDF challans, invoice photos) uploaded for delivery attachments.</li>
              <li><strong>Technical &amp; Telemetry Data:</strong> IP addresses, browser cookies, WhatsApp message delivery statuses (sent, delivered, read), and webhook transaction receipts.</li>
            </ul>
          </section>

          <section className="space-y-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">3. Purpose of Processing &amp; Legal Basis</h2>
            <p>We process your data exclusively for:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Dispatching authorized WhatsApp payment reminders and invoice media to your specified debtors.</li>
              <li>Generating pre-filled NPCI UPI deep links to route settlements directly into your bank account.</li>
              <li>Providing optical character recognition (OCR) parsing on uploaded paper bills and handwritten registers.</li>
              <li>Fulfilling legal, statutory, and tax compliance obligations under Indian law.</li>
            </ul>
          </section>

          <section className="space-y-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">4. WhatsApp Business Platform &amp; Meta Policies</h2>
            <p>
              Our communication automation relies on the official Meta WhatsApp Cloud API. We do not sell, rent, or trade your debtor telephone numbers or invoice details to third-party marketing brokers. Outbound messages strictly adhere to Meta&apos;s Business Messaging Policies and Template Guidelines.
            </p>
          </section>

          <section className="space-y-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">5. Data Retention &amp; Security Standards</h2>
            <p>
              We implement industry-standard 256-bit TLS/SSL encryption in transit and AES-256 encryption at rest. Merchant ledger data is stored in secure Indian cloud server regions. Merchants may request complete data expungement or export at any time by contacting our Grievance Officer.
            </p>
          </section>

          <section className="space-y-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">6. Grievance Officer</h2>
            <p>
              In accordance with the Information Technology Act, 2000 and DPDP Act, 2023, the details of the designated Grievance Officer are:
            </p>
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 bg-slate-50 dark:bg-slate-950 font-mono text-xs space-y-1">
              <div><strong>Name:</strong> Grievance Redressal Desk</div>
              <div><strong>Email:</strong> grievance@wasool.io / privacy@wasool.io</div>
              <div><strong>Jurisdiction:</strong> Mumbai / New Delhi, India</div>
              <div><strong>Response SLA:</strong> Within 48 business hours</div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
