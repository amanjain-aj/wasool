"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, QrCode, Building2, Save } from "lucide-react";
import { isValidVPA, isValidGSTIN } from "@/lib/upi";

interface OnboardingSetupModalProps {
  tenant: {
    id: string;
    business_name: string;
    brand_display_name: string;
    upi_vpa: string | null;
    bank_account_details?: string | null;
    gstin?: string | null;
  };
  onComplete: (updated: any) => void;
  onDismiss: () => void;
}

export function OnboardingSetupModal({
  tenant,
  onComplete,
  onDismiss,
}: OnboardingSetupModalProps) {
  const [upiVpa, setUpiVpa] = useState(tenant.upi_vpa || "");
  const [bankDetails, setBankDetails] = useState(tenant.bank_account_details || "");
  const [brandName, setBrandName] = useState(tenant.brand_display_name || tenant.business_name);
  const [gstin, setGstin] = useState(tenant.gstin || "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (upiVpa.trim() && !isValidVPA(upiVpa)) {
      return setError("Invalid UPI VPA format. Example: businessname@icici or 9820112233@paytm");
    }

    if (gstin.trim() && !isValidGSTIN(gstin)) {
      return setError("Invalid GSTIN format (15 characters alphanumeric).");
    }

    setBusy(true);
    try {
      const res = await fetch("/api/tenants", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: tenant.id,
          upi_vpa: upiVpa.trim(),
          bank_account_details: bankDetails.trim(),
          brand_display_name: brandName.trim(),
          gstin: gstin.trim(),
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to update configuration");

      onComplete(json.tenant);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error saving setup");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-700 dark:text-emerald-300">
        <div className="font-semibold flex items-center gap-1.5 mb-1">
          <CheckCircle2 className="h-4 w-4" /> Welcome to Wasool!
        </div>
        Configure your collection details so your buyers can settle their invoices instantly via 1-tap UPI or NEFT. You can also change these anytime later.
      </div>

      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-500 dark:text-rose-300">
          {error}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="label">Name Displayed to Buyers on WhatsApp</label>
          <div className="relative">
            <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              className="input pl-9"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              placeholder="e.g. Sharma Traders"
              required
            />
          </div>
        </div>

        <div>
          <label className="label">UPI ID / VPA for 1-Tap Payments (GPay / PhonePe / Paytm)</label>
          <div className="relative">
            <QrCode className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              className="input pl-9 font-mono"
              value={upiVpa}
              onChange={(e) => setUpiVpa(e.target.value)}
              placeholder="e.g. sharmatraders@icici"
            />
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            Buyers tap on WhatsApp to open their UPI app with your exact invoice amount pre-filled.
          </p>
        </div>

        <div>
          <label className="label">Bank Account / NEFT / RTGS Details (Optional)</label>
          <textarea
            className="input font-mono text-xs h-20"
            value={bankDetails}
            onChange={(e) => setBankDetails(e.target.value)}
            placeholder="A/C: 50200012345678&#10;IFSC: HDFC0000123&#10;Bank: HDFC Bank, Fort Branch"
          />
        </div>

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

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onDismiss}
            className="btn-secondary text-xs"
          >
            I&apos;ll configure later
          </button>
          <button
            type="submit"
            disabled={busy}
            className="btn-primary text-xs"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save &amp; Complete Setup
          </button>
        </div>
      </form>
    </div>
  );
}
