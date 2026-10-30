import Link from "next/link";
import { SignupForm } from "./SignupForm";

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ plan?: string }> }) {
  const { plan } = await searchParams;
  return (
    <main className="mx-auto max-w-xl px-6 py-16">
      <Link href="/" className="text-2xl font-black tracking-tight text-white">
        Wasool<span className="text-emerald-500">.io</span>
      </Link>
      <h1 className="mt-8 text-3xl font-bold text-white">Start your 14-day free pilot</h1>
      <p className="mt-2 text-sm text-slate-400">No card required. Upload your overdue invoices right after signup.</p>
      <SignupForm initialPlan={plan === "growth" ? "growth" : "starter"} />
    </main>
  );
}
