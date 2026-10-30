import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Wasool.io — Autopilot WhatsApp Payment Recovery with 1-Tap UPI",
  description:
    "Automated, diplomatic WhatsApp payment reminders with 1-tap UPI links—get paid 2.5x faster without awkward phone calls.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className="dark" suppressHydrationWarning>
      <body className="min-h-screen font-sans bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50 transition-colors duration-200">
        {children}
      </body>
    </html>
  );
}
