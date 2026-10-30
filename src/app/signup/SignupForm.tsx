"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { isValidGSTIN, isValidVPA, normalizeIndianPhone } from "@/lib/upi";

export function SignupForm({ initialPlan }: { initialPlan: "starter" | "growth" }) {
  const router = useRouter();
  const [form, setForm] = useState({
    business_name: "",
    brand_display_name: "",
    owner_email: "",
    owner_phone: "",
    gstin: "",
    upi_vpa: "",
    plan_tier: initialPlan,
  });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!normalizeIndianPhone(form.owner_phone)) return setError("Enter a valid Indian mobile number.");
    if (!isValidVPA(form.upi_vpa)) return setError("Enter a valid UPI VPA, e.g. yourbusiness@icici.");
    if (form.gstin && !isValidGSTIN(form.gstin)) return setError("GSTIN format looks invalid.");
    setBusy(true);
    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Signup failed");
      router.push(`/dashboard?tenant=${json.tenant_id}&welcome=1`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-8 space-y-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
      <div>
        <label className="label">Registered business name *</label>
        <input className="input" required value={form.business_name} onChange={set("business_name")} placeholder="Pixel & Pine Digital LLP" />
      </div>
      <div>
        <label className="label">Name shown on WhatsApp</label>
        <input className="input" value={form.brand_display_name} onChange={set("brand_display_name")} placeholder="Pixel & Pine Digital" maxLength={100} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Work email *</label>
          <input className="input" type="email" required value={form.owner_email} onChange={set("owner_email")} placeholder="accounts@yourfirm.in" />
        </div>
        <div>
          <label className="label">Mobile (WhatsApp) *</label>
          <input className="input" required value={form.owner_phone} onChange={set("owner_phone")} placeholder="98201 12233" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">UPI VPA for collections *</label>
          <input className="input" required value={form.upi_vpa} onChange={set("upi_vpa")} placeholder="yourfirm@icici" />
        </div>
        <div>
          <label className="label">GSTIN (optional)</label>
          <input className="input uppercase" value={form.gstin} onChange={set("gstin")} placeholder="27AAQFP1234C1Z5" maxLength={15} />
        </div>
      </div>
      <div>
        <label className="label">Plan</label>
        <select className="input" value={form.plan_tier} onChange={set("plan_tier")}>
          <option value="starter">Starter — ₹1,499/mo (100 invoices)</option>
          <option value="growth">Growth — ₹3,999/mo (400 invoices)</option>
        </select>
      </div>
      {error && <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">{error}</p>}
      <button className="btn-primary w-full py-3" disabled={busy}>
        {busy && <Loader2 className="h-4 w-4 animate-spin" />} Start free pilot
      </button>
    </form>
  );
}
