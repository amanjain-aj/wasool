"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, KeyRound, Loader2, Mail } from "lucide-react";
import Link from "next/link";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [step, setStep] = useState<"EMAIL" | "OTP">("EMAIL");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(false);

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setBusy(true);

    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send code");

      setMessage(data.message);
      setIsDemo(data.mode === "demo");
      setStep("OTP");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error sending code");
    } finally {
      setBusy(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Invalid code");

      if (data.tenant_id) {
        router.push(`/dashboard?tenant=${data.tenant_id}`);
      } else {
        router.push(`/dashboard`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error verifying code");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-8 shadow-2xl backdrop-blur-md">
      {error && (
        <div className="mb-6 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-300">
          {error}
        </div>
      )}

      {message && (
        <div className="mb-6 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-300">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
          <span>{message}</span>
        </div>
      )}

      {step === "EMAIL" ? (
        <form onSubmit={handleSendOtp} className="space-y-5">
          <div>
            <label className="label">Registered Work Email</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
              <input
                type="email"
                required
                className="input pl-10"
                placeholder="accounts@pixelpine.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
              />
            </div>
            <p className="mt-1.5 text-[11px] text-slate-500">
              We&apos;ll send a passwordless 6-digit OTP &amp; magic link to your inbox.
            </p>
          </div>

          <button type="submit" className="btn-primary w-full py-3" disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
            Continue with Email OTP
          </button>

          <div className="pt-2 text-center text-xs text-slate-400">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="font-semibold text-emerald-400 hover:underline">
              Start 14-Day Free Pilot
            </Link>
          </div>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} className="space-y-5">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="label mb-0">6-Digit Verification Code</label>
              <button
                type="button"
                onClick={() => setStep("EMAIL")}
                className="text-[11px] text-slate-400 hover:text-white"
              >
                Change email
              </button>
            </div>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
              <input
                type="text"
                required
                maxLength={6}
                className="input pl-10 font-mono tracking-widest text-base"
                placeholder="123456"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                autoFocus
              />
            </div>
            {isDemo && (
              <p className="mt-2 rounded-lg bg-slate-950 p-2 text-[11px] text-emerald-400 font-mono">
                💡 Demo Mode active: Type <span className="underline">123456</span> or any 6 digits to sign in.
              </p>
            )}
          </div>

          <button type="submit" className="btn-primary w-full py-3" disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            Verify &amp; Open Dashboard
          </button>
        </form>
      )}
    </div>
  );
}
