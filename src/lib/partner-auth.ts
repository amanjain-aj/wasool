import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import type { PartnerApiKey } from "@/types/wasool";
import { getStore } from "./store";
import { HttpError } from "./http";

export const hashApiKey = (raw: string) => createHash("sha256").update(raw).digest("hex");

/**
 * Validates `Authorization: Bearer wsl_live_...` against partner_api_keys
 * (SHA-256 hash lookup) and, when the key is bound to a partner slug, checks
 * the payload's partner_id matches.
 */
export async function authenticatePartner(req: Request, payloadPartnerId?: string): Promise<PartnerApiKey> {
  const header = req.headers.get("authorization");
  if (!header?.startsWith("Bearer wsl_live_")) throw new HttpError(401, "Unauthorized Partner Key");

  const raw = header.slice("Bearer ".length).trim();
  const key = await getStore().findPartnerKeyByHash(hashApiKey(raw));
  if (!key) throw new HttpError(401, "Unauthorized Partner Key");

  if (key.partner_id && payloadPartnerId) {
    const a = Buffer.from(key.partner_id);
    const b = Buffer.from(payloadPartnerId);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      throw new HttpError(403, `This key is not authorised for partner_id "${payloadPartnerId}"`);
    }
  }
  return key;
}
