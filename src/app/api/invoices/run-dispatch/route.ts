// POST /api/invoices/run-dispatch — dashboard "Run 10:30 AM IST cron now".
// Same engine as /api/cron/daily-dispatch, but authorised by the dashboard guard (middleware).
import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/http";
import { runDailyDispatch } from "@/lib/dispatch";

export async function POST() {
  try {
    return NextResponse.json(await runDailyDispatch());
  } catch (err) {
    return errorResponse(err);
  }
}
