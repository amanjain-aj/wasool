// POST /api/cron/morning-digest (Runs 09:30 AM IST Daily)
import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import { todayIST, formatDateIN, formatINR } from "@/lib/dates";
import { isWhatsAppLive, env } from "@/lib/config";
import axios from "axios";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (env.cronSecret() && authHeader !== `Bearer ${env.cronSecret()}` && getStore().mode !== "local") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const store = getStore();
    const tenants = await store.listTenants();
    const today = todayIST();
    let sentCount = 0;

    for (const tenant of tenants) {
      if (tenant.morning_digest_enabled === false || !tenant.is_active) continue;

      const invoices = await store.listInvoices(tenant.id);
      const pendingInvoices = invoices.filter((i) => {
        if (i.status !== "PENDING" && i.status !== "PARTIALLY_PAID") return false;
        if (i.debtor?.is_paused_until && i.debtor.is_paused_until >= today) return false;
        return true;
      });

      if (pendingInvoices.length === 0) continue;

      const totalPending = pendingInvoices.reduce((acc, curr) => acc + curr.amount_pending_inr, 0);
      const topParties = pendingInvoices.slice(0, 5);

      const digestText = `🌅 *Good Morning! Aaj Ka Munshi Tagada Digest (${formatDateIN(today)})*\n\n` +
        `• Active Overdue Bills: *${pendingInvoices.length}*\n` +
        `• Total Outstanding: *₹${formatINR(totalPending)}*\n\n` +
        `Aaj 11:00 AM in parties ko follow-up WhatsApp dispatch hoga:\n` +
        topParties.map((p, idx) => `${idx + 1}. ${p.debtor?.client_name}: ₹${formatINR(p.amount_pending_inr)} (Due: ${formatDateIN(p.due_date)})`).join("\n") +
        `\n\nKisi party ko 3 din ke liye rokna (pause) chahte hain to dashboard me toggle karein ya bot reply karein.`;

      if (isWhatsAppLive()) {
        await axios.post(
          `https://graph.facebook.com/v21.0/${process.env.META_PHONE_NUMBER_ID}/messages`,
          {
            messaging_product: "whatsapp",
            to: tenant.owner_phone.replace("+", ""),
            type: "text",
            text: { body: digestText }
          },
          {
            headers: {
              Authorization: `Bearer ${process.env.META_SYSTEM_USER_TOKEN}`,
              "Content-Type": "application/json"
            }
          }
        );
      } else {
        console.info(`[morning-digest:dry-run] Digest to ${tenant.owner_phone}:\n${digestText}`);
      }

      sentCount++;
    }

    return NextResponse.json({ ok: true, digests_sent: sentCount, date: today });
  } catch (err) {
    console.error("[morning-digest-err]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export const GET = POST;
