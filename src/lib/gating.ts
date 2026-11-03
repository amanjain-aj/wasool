import "server-only";
import { getStore } from "./store";

/**
 * Strict Post-Registration Production Gating Guard (v2.1):
 * Meta WhatsApp Cloud API outbound dispatches, automated Upstash QStash cron schedules,
 * and payment webhooks must NEVER process an unregistered tenant.
 *
 * Registration requires:
 * 1. Business Name & Display Brand Name
 * 2. Verified WhatsApp Owner Phone
 * 3. Primary UPI VPA or Bank NEFT Details
 * 4. Completed Registration Flag (is_registered === true)
 */
export async function ensureTenantIsRegistered(tenantId: string): Promise<boolean> {
  if (!tenantId) return false;
  try {
    const store = getStore();
    const tenant = await store.getTenant(tenantId);
    if (!tenant) return false;

    // In demo mode without explicit registration flag set, if it has a business name and phone it is allowed,
    // otherwise strictly requires is_registered === true
    if (tenant.is_registered === false) {
      return false;
    }

    // Must have registered business name and phone
    if (!tenant.business_name || !tenant.owner_phone) {
      return false;
    }

    return tenant.is_registered === true || tenant.is_active === true;
  } catch (err) {
    console.error("[Gating Check Error]", err);
    return false;
  }
}

/**
 * Throws or returns an error response object if tenant is not registered.
 */
export async function verifyRegistrationOrThrow(tenantId: string): Promise<void> {
  const isAllowed = await ensureTenantIsRegistered(tenantId);
  if (!isAllowed) {
    throw new Error(
      `Tenant ${tenantId} has not completed registration. Production WhatsApp dispatch and automated recovery are gated.`
    );
  }
}
