import "server-only";
import { randomUUID } from "node:crypto";
import { env, isWhatsAppLive } from "./config";

export { buildUPILink } from "./upi";

export interface DispatchArgs {
  recipientPhone: string;
  templateName: string;
  bodyParams: string[];
  /**
   * Dynamic suffix for the template's URL button. Meta only accepts https://
   * base URLs on template buttons, so templates are registered with the
   * button URL `${APP_URL}/pay/{{1}}` and we pass the invoice id here. The
   * /pay page then opens the `upi://pay` intent (and shows a QR on desktop).
   */
  buttonUrlSuffix: string;
  /** Per-tenant WhatsApp sender (Growth plan "custom verified brand"). */
  phoneNumberId?: string | null;
}

export interface DispatchResult {
  messageId: string;
  dryRun: boolean;
}

/**
 * Sends a pre-approved utility template via Meta WhatsApp Cloud API v21.0.
 * Without META_* credentials it runs in dry-run mode and returns a synthetic
 * message id so the full escalation pipeline can be exercised locally.
 */
export async function dispatchWhatsAppTemplate(args: DispatchArgs): Promise<DispatchResult> {
  if (!isWhatsAppLive()) {
    console.info(`[wasool:dry-run] ${args.templateName} -> ${args.recipientPhone}`, args.bodyParams);
    return { messageId: `wamid.DRYRUN.${randomUUID()}`, dryRun: true };
  }

  const phoneNumberId = args.phoneNumberId || env.metaPhoneNumberId();
  const url = `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.metaToken()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: args.recipientPhone.replace(/\D/g, ""),
      type: "template",
      template: {
        name: args.templateName,
        language: { code: env.metaTemplateLanguage() },
        components: [
          {
            type: "body",
            parameters: args.bodyParams.map((text) => ({ type: "text", text })),
          },
          {
            type: "button",
            sub_type: "url",
            index: "0",
            parameters: [{ type: "text", text: args.buttonUrlSuffix }],
          },
        ],
      },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Meta API Error (${response.status}): ${err}`);
  }
  const json = (await response.json()) as { messages?: Array<{ id: string }> };
  const messageId = json.messages?.[0]?.id;
  if (!messageId) throw new Error(`Meta API returned no message id: ${JSON.stringify(json)}`);
  return { messageId, dryRun: false };
}
