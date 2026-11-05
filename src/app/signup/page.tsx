import Link from "next/link";
import { SignupForm } from "./SignupForm";
import { BrandLogo } from "@/components/BrandLogo";

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ plan?: string }> }) {
  const { plan } = await searchParams;
  return (
    <main className="mx-auto max-w-xl px-6 py-16">
      <div className="text-center mb-8 flex flex-col items-center">
        <BrandLogo size="lg" />
        <h1 className="mt-4 text-2xl font-bold text-slate-900 dark:text-white">Start Your 14-Day Free Pilot</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Sign up in 30 seconds. No credit card required. Add your collection details anytime.
        </p>
      </div>
      <SignupForm initialPlan={plan || "munshi_standard"} />
    </main>
  );
}
