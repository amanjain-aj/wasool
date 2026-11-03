import Link from "next/link";
import { ShieldCheck, Users, Receipt, Send, ArrowLeft } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

export const metadata = {
  title: "Super-Admin Panel — Wasool.io",
  description: "Internal Super-Admin Customer Management, Quota Monitoring, and UTR Overrides.",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50 font-sans selection:bg-rose-500 selection:text-white">
      {/* Admin Top Header */}
      <header className="border-b border-rose-500/20 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="flex items-center gap-2">
              <span className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
                Wasool<span className="text-emerald-500">.io</span>
              </span>
              <span className="rounded-md bg-rose-500/10 border border-rose-500/30 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-rose-600 dark:text-rose-400">
                Super Admin
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-5 text-xs font-semibold text-slate-600 dark:text-slate-300">
              <Link href="/admin" className="hover:text-slate-900 dark:hover:text-white transition flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-rose-500 dark:text-rose-400" />
                Overview
              </Link>
              <Link href="/admin/tenants" className="hover:text-slate-900 dark:hover:text-white transition flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-sky-500 dark:text-sky-400" />
                Customers &amp; Gating
              </Link>
              <Link href="/admin/reconciliations" className="hover:text-slate-900 dark:hover:text-white transition flex items-center gap-1.5">
                <Receipt className="h-3.5 w-3.5 text-amber-500 dark:text-amber-400" />
                UTR Overrides
              </Link>
              <Link href="/admin/broadcast" className="hover:text-slate-900 dark:hover:text-white transition flex items-center gap-1.5">
                <Send className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400" />
                WhatsApp Broadcast
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white px-3 py-1.5 rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 transition"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Client Dashboard
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Admin Area */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  );
}
