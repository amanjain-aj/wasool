"use client";

import { useState } from "react";
import Link from "next/link";
import { Lock, Menu, X, ArrowRight } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

export function LandingHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: "How It Works", href: "#how-it-works" },
    { label: "Features", href: "#features" },
    { label: "Live Preview", href: "#preview" },
    { label: "Pricing", href: "#pricing" },
    { label: "FAQ", href: "#faq" },
  ];

  function handleNavClick() {
    setMobileMenuOpen(false);
  }

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-slate-50/90 dark:bg-slate-950/90 border-b border-slate-200/70 dark:border-slate-800/70">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-1">
          Wasool<span className="text-emerald-500">.io</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex space-x-7 text-sm text-slate-600 dark:text-slate-400 font-medium">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="hover:text-emerald-600 dark:hover:text-white transition"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden sm:flex items-center gap-3">
          <ThemeToggle />
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition active:scale-95 shadow-sm"
          >
            <Lock className="w-3.5 h-3.5 text-emerald-500" />
            <span>Sign In</span>
          </Link>
          <Link
            href="/signup"
            className="btn-primary text-xs sm:text-sm py-2 px-3.5"
          >
            Start Free Pilot
          </Link>
        </div>

        {/* Mobile Actions: ThemeToggle + Hamburger */}
        <div className="flex sm:hidden items-center gap-2">
          <ThemeToggle />
          <Link
            href="/login"
            className="inline-flex items-center justify-center p-2 rounded-lg text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
            title="Sign In"
            aria-label="Sign In"
          >
            <Lock className="w-4 h-4 text-emerald-500" />
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="inline-flex items-center justify-center p-2 rounded-lg text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-5 h-5 text-slate-900 dark:text-white" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur-lg px-4 py-5 shadow-2xl animate-in slide-in-from-top-2 duration-200">
          <nav className="flex flex-col space-y-3.5 mb-5 text-sm font-medium">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={handleNavClick}
                className="px-2 py-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 transition flex items-center justify-between"
              >
                <span>{link.label}</span>
                <span className="text-slate-400 text-xs">→</span>
              </a>
            ))}
            <Link
              href="/partner-docs"
              onClick={handleNavClick}
              className="px-2 py-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 transition flex items-center justify-between"
            >
              <span>Partner API Docs</span>
              <span className="text-emerald-500 text-xs font-semibold">B2B</span>
            </Link>
          </nav>

          <div className="flex flex-col gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
            <Link
              href="/signup"
              onClick={handleNavClick}
              className="btn-primary w-full py-3 text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20"
            >
              <span>Start Munshi Free (14-Day Pilot)</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              onClick={handleNavClick}
              className="w-full py-2.5 text-center text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 transition"
            >
              Existing Account? Sign In to Dashboard
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
