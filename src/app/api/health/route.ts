// GET /api/health — runtime mode for the UI (no secrets exposed)
import { NextResponse } from "next/server";
import { DEMO_PARTNER_KEY, isWhatsAppLive } from "@/lib/config";
import { getStore } from "@/lib/store";
import { todayIST } from "@/lib/dates";

export const dynamic = "force-dynamic";

export function GET() {
  const mode = getStore().mode;
  return NextResponse.json({
    status: "ok",
    store: mode,
    whatsapp: isWhatsAppLive() ? "live" : "dry-run",
    today_ist: todayIST(),
    // Only exposed in local demo mode, where it is the sole accepted key.
    demo_partner_key: mode === "local" ? DEMO_PARTNER_KEY : undefined,
  });
}
