"use client";

import { useState } from "react";
import { Building2, QrCode, CheckCircle2, Loader2, Save, Globe, ShieldCheck } from "lucide-react";
import { isValidVPA, isValidGSTIN } from "@/lib/upi";
import type { Tenant } from "@/types/wasool";

export function SettingsClient({ tenant }: { tenant: Tenant }) {
  const [businessName, setBusinessName] = useState(tenant.business_name || "");
  const [brandName, setBrandName] = useState(tenant.brand_display_name || tenant.business_name || "");
  const [upiVpa, setUpiVpa] = useState(tenant.upi_vpa || "");
  const [bankDetails, setBankDetails] = useState(tenant.bank_account_details || "");
  const [gstin, setGstin] = useState(tenant.gstin || "");
  const [language, setLanguage] = useState(tenant.preferred_language || "HINGLISH");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (upiVpa.trim() && !isValidVPA(upiVpa.trim())) {
      return setError("Invalid UPI VPA format. Example: businessname@icici or 9820112233@paytm");
    }

    if (gstin.trim() && !isValidGSTIN(gstin.trim())) {
      return setError("Invalid GSTIN format (15 characters alphanumeric).");
    }

    setBusy(true);
    try {
      const res = await fetch("/api/tenants", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: tenant.id,
          business_name: businessName.trim(),
          brand_display_name: brandName.trim(),
          upi_vpa: upiVpa.trim(),
          bank_account_details: bankDetails.trim(),
          gstin: gstin.trim(),
          preferred_language: language,
          is_registered: true,
          registration_step: "COMPLETED",
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to update settings");

      setSuccess("Business and collection settings saved successfully! Production gating passed.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error saving configuration");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-300">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
          <span>{success}</span>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/60 p-6 shadow-xl">
        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <label className="label">Legal Registered Business Name</label>
            <div className="relative">
              <Building2 className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
              <input
                className="input pl-10"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Sharma Hardware &amp; Sanitary LLP"
                required
              />
            </div>
          </div>

          <div>
            <label className="label">WhatsApp Display Brand Name (Shown to Debtors)</label>
            <input
              className="input"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              placeholder="Sharma Hardware"
              required
            />
            <p className="mt-1 text-[11px] text-slate-500">
              This name appears in the WhatsApp greeting (e.g. &quot;Hi, greetings from Sharma Hardware...&quot;).
            </p>
          </div>

          <div>
            <label className="label">Primary UPI ID / VPA for 1-Tap Payment Collection</label>
            <div className="relative">
              <QrCode className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
              <input
                className="input pl-10 font-mono"
                value={upiVpa}
                onChange={(e) => setUpiVpa(e.target.value)}
                placeholder="sharmahardware@icici"
                required
              />
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              When debtors tap the payment button on WhatsApp, their UPI app opens with your UPI ID and exact bill amount.
            </p>
          </div>

          <div>
            <label className="label">Bank Account / NEFT / RTGS Details (Optional for Large Transfers)</label>
            <textarea
              className="input font-mono text-xs h-24"
              value={bankDetails}
              onChange={(e) => setBankDetails(e.target.value)}
              placeholder="A/C No: 50200098765432&#10;IFSC: HDFC0000123&#10;Bank: HDFC Bank, Fort Branch&#10;Beneficiary: Sharma Hardware & Sanitary LLP"
            />
            <p className="mt-1 text-[11px] text-slate-500">
              For bills exceeding ₹1,00,000, these details are included alongside the UPI link.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">GSTIN (Optional)</label>
              <input
                className="input uppercase font-mono"
                value={gstin}
                onChange={(e) => setGstin(e.target.value)}
                placeholder="27AAQFP1234C1Z5"
                maxLength={15}
              />
            </div>

            <div>
              <label className="label">Preferred Munshi Follow-up Language</label>
              <select
                className="input"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                <option value="HINGLISH">Hinglish (Most Effective)</option>
                <option value="ENGLISH">Formal English</option>
                <option value="HINDI">Shuddh Hindi</option>
              </select>
            </div>
          </div>

          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span>
              Saving your UPI ID validates your registration and activates automated 10:30 AM WhatsApp escalations.
            </span>
          </div>

          <button
            type="submit"
            disabled={busy}
            className="btn-primary w-full py-3 flex items-center justify-center gap-2"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save &amp; Activate Production Gating
          </button>
        </form>
      </div>
    </div>
  );
}
