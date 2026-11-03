"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, Loader2, Lock, ShieldCheck } from "lucide-react";
import { normalizeIndianPhone } from "@/lib/upi";
import Link from "next/link";

export function SignupForm({ initialPlan }: { initialPlan: string }) {
  const router = useRouter();
  const [form, setForm] = useState({
    business_name: "",
    owner_email: "",
    owner_phone: "",
    plan_tier: initialPlan || "starter",
  });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.business_name.trim()) return setError("Please enter your business or firm name.");
    if (!normalizeIndianPhone(form.owner_phone)) return setError("Please enter a valid 10-digit Indian mobile number.");
    
    setBusy(true);
    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Signup failed");
      
      // Route immediately into dashboard with setup prompt
      router.push(`/dashboard?tenant=${json.tenant_id}&setup=1`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setBusy(false);
    }
  }

  return (
    <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-8 shadow-2xl backdrop-blur-md">
      <form onSubmit={submit} className="space-y-5">
        <div>
          <label className="label">Business / Firm Name *</label>
          <input
            className="input"
            required
            value={form.business_name}
            onChange={set("business_name")}
            placeholder="e.g. Apex Engineering Works / Sharma Traders"
            autoFocus
          />
          <p className="mt-1 text-[11px] text-slate-500">Your clients will see this name on bills and reminders.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Work Email *</label>
            <input
              className="input"
              type="email"
              required
              value={form.owner_email}
              onChange={set("owner_email")}
              placeholder="accounts@yourfirm.in"
            />
          </div>
          <div>
            <label className="label">WhatsApp Number *</label>
            <input
              className="input"
              required
              value={form.owner_phone}
              onChange={set("owner_phone")}
              placeholder="98201 12233"
            />
          </div>
        </div>

        <div>
          <label className="label">Plan Tier</label>
          <select className="input cursor-pointer" value={form.plan_tier} onChange={set("plan_tier")}>
            <option value="munshi_standard">Munshi Standard — ₹999/mo (100 bills, Photo/Voice Tagada)</option>
            <option value="munshi_vyapar_pro">Munshi Vyapar Pro — ₹2,499/mo (350 bills, Staff Delegation)</option>
            <option value="starter">Direct Agency Starter — ₹1,499/mo</option>
            <option value="growth">Direct Agency Growth — ₹3,999/mo</option>
          </select>
        </div>

        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400 mb-1">
            <CheckCircle2 className="h-4 w-4" /> 14-Day Free Trial Activated
          </div>
          You can add your UPI ID, bank details, and staff delegation anytime from your settings after registration.
        </div>

        {error && (
          <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-500 dark:text-rose-300">
            {error}
          </p>
        )}

        <button className="btn-primary w-full py-3.5 text-base" disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />} 
          Start 14-Day Free Pilot
        </button>

        <div className="pt-2 text-center text-xs text-slate-500 dark:text-slate-400">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline">
            Sign In with Email OTP
          </Link>
        </div>
      </form>
    </div>
  );
}
