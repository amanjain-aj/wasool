import Link from "next/link";
import { LoginForm } from "./LoginForm";
import { ShieldCheck } from "lucide-react";

export const metadata = {
  title: "Merchant Login — Wasool.io",
  description: "Sign in to your Wasool B2B accounts receivable dashboard with passwordless email OTP.",
};

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
      <div className="mb-8 text-center">
        <Link href="/" className="text-3xl font-black tracking-tight text-white">
          Wasool<span className="text-emerald-500">.io</span>
        </Link>
        <h1 className="mt-4 text-xl font-bold text-white">Sign In to Wasool Dashboard</h1>
        <p className="mt-1 text-xs text-slate-400">
          Instant passwordless access for agencies, vendors, and finance teams.
        </p>
      </div>

      <LoginForm />

      <div className="mt-8 flex items-center justify-center gap-1.5 text-xs text-slate-500">
        <ShieldCheck className="h-4 w-4 text-emerald-400" />
        <span>Enterprise 256-bit encrypted authentication</span>
      </div>
    </main>
  );
}
