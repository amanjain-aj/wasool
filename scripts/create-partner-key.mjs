#!/usr/bin/env node
// Generates a partner API key and prints the SQL to register it in Supabase.
// Usage: npm run partner-key -- "Khatabook Production" khatabook
import { createHash, randomBytes } from "node:crypto";

const [partnerName = "New Partner", partnerId = ""] = process.argv.slice(2);
const raw = `wsl_live_${randomBytes(24).toString("hex")}`;
const hash = createHash("sha256").update(raw).digest("hex");
const webhookSecret = `whsec_${randomBytes(24).toString("hex")}`;
const esc = (s) => s.replace(/'/g, "''");

console.log(`\nRaw API key (give to partner ONCE, never store): ${raw}`);
console.log(`Webhook secret: ${webhookSecret}\n`);
console.log("-- Run in Supabase SQL editor:");
console.log(
  `INSERT INTO partner_api_keys (partner_name, partner_id, api_key_hash, key_prefix, webhook_secret)\n` +
    `VALUES ('${esc(partnerName)}', ${partnerId ? `'${esc(partnerId)}'` : "NULL"}, '${hash}', 'wsl_live_', '${webhookSecret}');\n`,
);
