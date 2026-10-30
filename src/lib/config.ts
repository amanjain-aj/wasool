import "server-only";

// Env access is done at call time so `.env.local` changes apply on restart
// and nothing is captured at module load during build.

export const env = {
  appUrl: () => (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, ""),
  supabaseUrl: () => process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  supabaseServiceKey: () => process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  metaPhoneNumberId: () => process.env.META_PHONE_NUMBER_ID || "",
  metaToken: () => process.env.META_SYSTEM_USER_TOKEN || "",
  metaTemplateLanguage: () => process.env.META_TEMPLATE_LANGUAGE || "en",
  metaWebhookVerifyToken: () => process.env.META_WEBHOOK_VERIFY_TOKEN || "",
  qstashCurrentKey: () => process.env.QSTASH_CURRENT_SIGNING_KEY || "",
  qstashNextKey: () => process.env.QSTASH_NEXT_SIGNING_KEY || "",
  cronSecret: () => process.env.CRON_SECRET || "",
  razorpayWebhookSecret: () => process.env.RAZORPAY_WEBHOOK_SECRET || "",
};

export const isSupabaseConfigured = () => Boolean(env.supabaseUrl() && env.supabaseServiceKey());
export const isWhatsAppLive = () => Boolean(env.metaPhoneNumberId() && env.metaToken());

/** Raw demo partner key accepted only in local demo mode. */
export const DEMO_PARTNER_KEY = "wsl_live_demo_khatabook_7f3a9c21";
