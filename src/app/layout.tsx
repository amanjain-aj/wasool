import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Wasool.io — 24/7 Digital WhatsApp Munshi with 1-Tap UPI",
  description:
    "Automated, diplomatic WhatsApp payment reminders with original bill media attachment & 1-tap UPI deep links. Get paid 2.5x faster without awkward calls.",
  icons: {
    icon: "/icon.svg",
    shortcut: "/favicon.svg",
    apple: "/icon.svg",
  },
  manifest: "/manifest.json",
  openGraph: {
    title: "Wasool.io — 24/7 Digital WhatsApp Munshi with 1-Tap UPI",
    description:
      "Automated, diplomatic WhatsApp payment recovery for Indian B2B agencies, wholesalers, and manufacturers. Direct NPCI UPI deep links.",
    url: "https://wasool.io",
    siteName: "Wasool.io",
    locale: "en_IN",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const stored = localStorage.getItem('wasool_theme');
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                if (stored === 'light' || (!stored && !prefersDark)) {
                  document.documentElement.classList.remove('dark');
                } else {
                  document.documentElement.classList.add('dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="min-h-screen font-sans bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50 transition-colors duration-200">
        {children}
      </body>
    </html>
  );
}
