// POST /api/invoices/reset-demo — re-seed the local demo store (local mode only)
import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import { resetLocalDb } from "@/lib/store/local";

export async function POST() {
  if (getStore().mode !== "local") {
    return NextResponse.json({ error: "Demo reset is only available in local demo mode" }, { status: 403 });
  }
  resetLocalDb();
  return NextResponse.json({ ok: true });
}
