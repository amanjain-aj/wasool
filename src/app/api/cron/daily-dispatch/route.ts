// /api/cron/daily-dispatch — Upstash QStash schedule, daily at 10:30 AM IST
//   QStash cron: "CRON_TZ=Asia/Kolkata 30 10 * * *"   (or "0 5 * * *" UTC)
// Auth: Upstash-Signature (QSTASH_*_SIGNING_KEY) or "Authorization: Bearer CRON_SECRET".
// With neither configured, the endpoint is open only in local demo mode.
import { NextRequest, NextResponse } from "next/server";
import { Receiver } from "@upstash/qstash";
import { env } from "@/lib/config";
import { errorResponse } from "@/lib/http";
import { getStore } from "@/lib/store";
import { runDailyDispatch } from "@/lib/dispatch";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

async function isAuthorized(req: NextRequest, rawBody: string): Promise<boolean> {
  const secret = env.cronSecret();
  if (secret && req.headers.get("authorization") === `Bearer ${secret}`) return true;

  const signature = req.headers.get("upstash-signature");
  const current = env.qstashCurrentKey();
  if (signature && current) {
    const receiver = new Receiver({ currentSigningKey: current, nextSigningKey: env.qstashNextKey() || current });
    try {
      return await receiver.verify({ signature, body: rawBody });
    } catch {
      return false;
    }
  }
  return !secret && !current && getStore().mode === "local";
}

async function handle(req: NextRequest) {
  try {
    const rawBody = req.method === "POST" ? await req.text() : "";
    if (!(await isAuthorized(req, rawBody))) {
      return NextResponse.json({ error: "Unauthorized cron invocation" }, { status: 401 });
    }
    const summary = await runDailyDispatch();
    console.info(`[wasool:cron] ${summary.run_date} sent=${summary.sent} failed=${summary.failed} skipped=${summary.skipped}`);
    return NextResponse.json(summary);
  } catch (err) {
    return errorResponse(err);
  }
}

export const POST = handle;
export const GET = handle;
