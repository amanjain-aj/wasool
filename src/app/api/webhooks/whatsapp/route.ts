// /api/webhooks/whatsapp — Meta Cloud API delivery-status webhook.
// GET: subscription handshake (hub.verify_token). POST: statuses -> reminder_dispatches.delivery_status.
import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/config";
import { getStore } from "@/lib/store";
import type { DeliveryStatus } from "@/types/wasool";

export function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const token = env.metaWebhookVerifyToken();
  if (token && p.get("hub.mode") === "subscribe" && p.get("hub.verify_token") === token) {
    return new NextResponse(p.get("hub.challenge") ?? "", { status: 200 });
  }
  return new NextResponse("Forbidden", { status: 403 });
}

const STATUS_MAP: Record<string, DeliveryStatus> = {
  sent: "SENT",
  delivered: "DELIVERED",
  read: "READ",
  failed: "FAILED",
};

interface MetaWebhook {
  entry?: Array<{
    changes?: Array<{
      value?: { statuses?: Array<{ id: string; status: string; errors?: Array<{ title?: string; message?: string }> }> };
    }>;
  }>;
}

export async function POST(req: NextRequest) {
  // Always 200 quickly so Meta doesn't retry-storm; log failures.
  try {
    const body = (await req.json()) as MetaWebhook;
    const store = getStore();
    for (const entry of body.entry ?? []) {
      for (const change of entry.changes ?? []) {
        for (const s of change.value?.statuses ?? []) {
          const status = STATUS_MAP[s.status];
          if (!status) continue;
          // MVP: last status wins. Meta can deliver statuses out of order, so a
          // late "delivered" may overwrite "read"; acceptable for the dashboard.
          await store.updateDispatchByMessageId(s.id, {
            delivery_status: status,
            ...(status === "FAILED" ? { error_message: s.errors?.map((e) => e.message || e.title).join("; ") ?? "failed" } : {}),
          });
        }
      }
    }
  } catch (err) {
    console.error("[wasool:whatsapp-webhook]", err);
  }
  return NextResponse.json({ ok: true });
}
