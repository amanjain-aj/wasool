import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import { errorResponse, readJson } from "@/lib/http";
import { isWhatsAppLive } from "@/lib/config";
import axios from "axios";

export async function POST(req: NextRequest) {
  try {
    const { templateName, announcementText, targetGroup } = await readJson<{
      templateName: string;
      announcementText: string;
      targetGroup: string;
    }>(req);

    const store = getStore();
    const tenants = await store.listTenants();

    // Only broadcast to registered / active tenants
    const eligibleTenants = tenants.filter((t) => {
      const isReg = t.is_registered === true || t.is_active === true;
      if (!isReg) return false;
      if (targetGroup === "FREE_TRIAL") return t.subscription_plan === "FREE_TRIAL";
      if (targetGroup === "PRO") return t.subscription_plan === "munshi_vyapar_pro" || t.plan_tier === "growth";
      return true;
    });

    let dispatchedCount = 0;
    const isLive = isWhatsAppLive();

    for (const tenant of eligibleTenants) {
      if (!tenant.owner_phone) continue;
      dispatchedCount++;

      if (isLive) {
        try {
          const url = `https://graph.facebook.com/v21.0/${process.env.META_PHONE_NUMBER_ID}/messages`;
          await axios.post(
            url,
            {
              messaging_product: "whatsapp",
              to: tenant.owner_phone.replace(/^\+/, ""),
              type: "template",
              template: {
                name: templateName,
                language: { code: "en" },
                components: [
                  {
                    type: "body",
                    parameters: [
                      { type: "text", text: tenant.brand_display_name || tenant.business_name },
                      { type: "text", text: announcementText },
                    ],
                  },
                ],
              },
            },
            {
              headers: {
                Authorization: `Bearer ${process.env.META_SYSTEM_USER_TOKEN}`,
                "Content-Type": "application/json",
              },
              timeout: 10000,
            }
          );
        } catch (err: any) {
          console.error(`[Broadcast Error to ${tenant.owner_phone}]`, err?.response?.data || err?.message);
        }
      }
    }

    await store.logAdminAction("superadmin@wasool.io", "DISPATCH_BROADCAST", null, {
      templateName,
      targetGroup,
      recipientCount: dispatchedCount,
      dryRun: !isLive,
    });

    return NextResponse.json({
      ok: true,
      dispatched_count: dispatchedCount,
      dry_run: !isLive,
    });
  } catch (err) {
    return errorResponse(err);
  }
}
