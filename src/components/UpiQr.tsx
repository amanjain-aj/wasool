"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

/** Renders a UPI intent URL as a scannable QR (for desktop viewers). */
export function UpiQr({ value, size = 160 }: { value: string; size?: number }) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    QRCode.toDataURL(value, { width: size, margin: 1, color: { dark: "#020617", light: "#ffffff" } })
      .then((url) => alive && setSrc(url))
      .catch(() => alive && setSrc(null));
    return () => {
      alive = false;
    };
  }, [value, size]);

  if (!src) return <div style={{ width: size, height: size }} className="animate-pulse rounded-lg bg-slate-800" />;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} width={size} height={size} alt="UPI payment QR code" className="rounded-lg" />;
}
