import React from "react";
import Link from "next/link";

interface BrandLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  href?: string;
  showSubtitle?: boolean;
}

export function BrandLogo({
  className = "",
  size = "md",
  href = "/",
  showSubtitle = false,
}: BrandLogoProps) {
  const iconSizes = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-10 h-10",
  };

  const textSizes = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-3xl",
  };

  const content = (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {/* Brand Icon SVG */}
      <div className={`relative ${iconSizes[size]} shrink-0 flex items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-1.5 shadow-md shadow-emerald-500/20`}>
        <svg viewBox="0 0 40 40" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Rupee & Chat Munshi Path */}
          <path d="M8 8h24M8 14h18M14 8v24M14 14c8 0 12 3 12 8s-4 8-12 8M14 26l14 10" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="32" cy="30" r="4.5" fill="#f59e0b" />
        </svg>
      </div>

      <div className="flex flex-col">
        <span className={`${textSizes[size]} font-black tracking-tight text-slate-900 dark:text-white leading-none`}>
          Wasool<span className="text-emerald-500">.io</span>
        </span>
        {showSubtitle && (
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 dark:text-slate-400 mt-0.5">
            Digital Tagada Munshi
          </span>
        )}
      </div>
    </div>
  );

  if (href) {
    return <Link href={href} className="inline-block transition hover:opacity-90">{content}</Link>;
  }

  return content;
}
