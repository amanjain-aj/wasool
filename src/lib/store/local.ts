import "server-only";
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { Debtor, Invoice, InvoiceWithRelations, ReminderDispatch, Tenant } from "@/types/wasool";
import type { WasoolStore } from "./types";
import { buildSeed, LOCAL_DB_VERSION, type LocalDb } from "./seed";

/**
 * Local demo store: in-memory, persisted to `.data/wasool-db.json` when the
 * filesystem is writable (falls back to memory-only on read-only hosts).
 */
const DB_DIR = path.join(process.cwd(), ".data");
const DB_FILE = path.join(DB_DIR, "wasool-db.json");

const g = globalThis as unknown as { __wasoolLocalDb?: LocalDb };

function load(): LocalDb {
  if (g.__wasoolLocalDb) return g.__wasoolLocalDb;
  try {
    const parsed = JSON.parse(fs.readFileSync(DB_FILE, "utf8")) as LocalDb;
    if (parsed.version === LOCAL_DB_VERSION) {
      g.__wasoolLocalDb = parsed;
      return parsed;
    }
  } catch {
    /* no file yet / unreadable -> seed */
  }
  g.__wasoolLocalDb = buildSeed();
  persist();
  return g.__wasoolLocalDb;
}

function persist() {
  try {
    fs.mkdirSync(DB_DIR, { recursive: true });
    fs.writeFileSync(DB_FILE, JSON.stringify(g.__wasoolLocalDb, null, 2));
  } catch {
    /* read-only filesystem: keep in memory */
  }
}

export function resetLocalDb() {
  g.__wasoolLocalDb = buildSeed();
  persist();
}

const clone = <T>(v: T): T => structuredClone(v);

function withRelations(db: LocalDb, inv: Invoice): InvoiceWithRelations {
  return clone({
    ...inv,
    debtor: db.debtors.find((d) => d.id === inv.debtor_id)!,
    tenant: db.tenants.find((t) => t.id === inv.tenant_id)!,
    dispatches: db.reminder_dispatches
      .filter((r) => r.invoice_id === inv.id)
      .sort((a, b) => a.scheduled_for.localeCompare(b.scheduled_for)),
  });
}

export function createLocalStore(): WasoolStore {
  return {
    mode: "local",

    async listTenants() {
      return clone(load().tenants);
    },
    async getTenant(id) {
      return clone(load().tenants.find((t) => t.id === id) ?? null);
    },
    async findTenantByPartner(partnerId, merchantId) {
      const t = load().tenants.find((x) => x.partner_id === partnerId && x.partner_merchant_id === merchantId);
      return clone(t ?? null);
    },
    async upsertTenant(input) {
      const db = load();
      const existing = db.tenants.find((t) => t.owner_email.toLowerCase() === input.owner_email.toLowerCase());
      if (existing) {
        Object.assign(existing, input);
        persist();
        return clone(existing);
      }
      const t: Tenant = {
        type: "DIRECT_BUSINESS",
        partner_id: null,
        partner_merchant_id: null,
        gstin: null,
        whatsapp_phone_number_id: null,
        plan_tier: "starter",
        is_active: true,
        ...input,
        id: randomUUID(),
        created_at: new Date().toISOString(),
      };
      db.tenants.push(t);
      persist();
      return clone(t);
    },
    async updateTenant(id, patch) {
      const db = load();
      const t = db.tenants.find((x) => x.id === id);
      if (!t) throw new Error(`Tenant ${id} not found`);
      if (patch.owner_email && db.tenants.some((x) => x.id !== id && x.owner_email === patch.owner_email)) {
        throw new Error(`owner_email ${patch.owner_email} already belongs to another tenant`);
      }
      Object.assign(t, patch);
      persist();
      return clone(t);
    },

    async upsertDebtor(input) {
      const db = load();
      const existing = db.debtors.find((d) => d.tenant_id === input.tenant_id && d.phone === input.phone);
      if (existing) {
        existing.client_name = input.client_name;
        if (input.contact_person !== undefined) existing.contact_person = input.contact_person;
        if (input.email !== undefined) existing.email = input.email;
        persist();
        return clone(existing);
      }
      const d: Debtor = {
        id: randomUUID(),
        tenant_id: input.tenant_id,
        client_name: input.client_name,
        contact_person: input.contact_person ?? null,
        phone: input.phone,
        email: input.email ?? null,
        created_at: new Date().toISOString(),
      };
      db.debtors.push(d);
      persist();
      return clone(d);
    },

    async upsertInvoice(input) {
      const db = load();
      const existing = db.invoices.find((i) => i.tenant_id === input.tenant_id && i.invoice_number === input.invoice_number);
      if (existing) {
        Object.assign(existing, {
          ...input,
          external_invoice_id: input.external_invoice_id ?? existing.external_invoice_id,
          autopilot_enabled: input.autopilot_enabled ?? existing.autopilot_enabled,
        });
        persist();
        return clone(existing);
      }
      const inv: Invoice = {
        id: randomUUID(),
        status: "PENDING",
        utr_reference: null,
        created_at: new Date().toISOString(),
        ...input,
        external_invoice_id: input.external_invoice_id ?? null,
        autopilot_enabled: input.autopilot_enabled ?? true,
      };
      db.invoices.push(inv);
      persist();
      return clone(inv);
    },
    async getInvoice(id) {
      const db = load();
      const inv = db.invoices.find((i) => i.id === id);
      return inv ? withRelations(db, inv) : null;
    },
    async findInvoice(tenantId, by) {
      const inv = load().invoices.find(
        (i) =>
          i.tenant_id === tenantId &&
          ((by.invoice_number && i.invoice_number === by.invoice_number) ||
            (by.external_invoice_id && i.external_invoice_id === by.external_invoice_id)),
      );
      return clone(inv ?? null);
    },
    async listInvoices(tenantId) {
      const db = load();
      return db.invoices
        .filter((i) => !tenantId || i.tenant_id === tenantId)
        .sort((a, b) => a.due_date.localeCompare(b.due_date))
        .map((i) => withRelations(db, i));
    },
    async updateInvoice(id, patch) {
      const db = load();
      const inv = db.invoices.find((i) => i.id === id);
      if (!inv) throw new Error(`Invoice ${id} not found`);
      Object.assign(inv, patch);
      persist();
      return clone(inv);
    },

    async replaceQueuedDispatches(invoiceId, rows) {
      const db = load();
      db.reminder_dispatches = db.reminder_dispatches.filter(
        (r) => !(r.invoice_id === invoiceId && r.delivery_status === "QUEUED"),
      );
      const created = new Date().toISOString();
      for (const row of rows) {
        db.reminder_dispatches.push({
          id: randomUUID(),
          invoice_id: invoiceId,
          tier: row.tier,
          scheduled_for: row.scheduled_for,
          dispatched_at: null,
          whatsapp_message_id: null,
          delivery_status: "QUEUED",
          error_message: null,
          created_at: created,
        });
      }
      persist();
    },
    async deleteQueuedDispatches(invoiceId) {
      const db = load();
      const before = db.reminder_dispatches.length;
      db.reminder_dispatches = db.reminder_dispatches.filter(
        (r) => !(r.invoice_id === invoiceId && r.delivery_status === "QUEUED"),
      );
      persist();
      return before - db.reminder_dispatches.length;
    },
    async listDueDispatches(onOrBefore) {
      return clone(
        load().reminder_dispatches.filter((r) => r.delivery_status === "QUEUED" && r.scheduled_for <= onOrBefore),
      );
    },
    async listRecentDispatches(limit, tenantId) {
      const db = load();
      return db.reminder_dispatches
        .filter((r) => r.dispatched_at)
        .map((r) => {
          const inv = db.invoices.find((i) => i.id === r.invoice_id);
          const debtor = inv && db.debtors.find((d) => d.id === inv.debtor_id);
          return { r, inv, debtor };
        })
        .filter((x) => x.inv && (!tenantId || x.inv.tenant_id === tenantId))
        .sort((a, b) => (b.r.dispatched_at ?? "").localeCompare(a.r.dispatched_at ?? ""))
        .slice(0, limit)
        .map((x) => clone({ ...x.r, invoice_number: x.inv!.invoice_number, client_name: x.debtor?.client_name ?? "" }));
    },
    async insertDispatch(row) {
      const db = load();
      const d: ReminderDispatch = {
        id: randomUUID(),
        invoice_id: row.invoice_id,
        tier: row.tier,
        scheduled_for: row.scheduled_for,
        dispatched_at: row.dispatched_at ?? null,
        whatsapp_message_id: row.whatsapp_message_id ?? null,
        delivery_status: row.delivery_status,
        error_message: row.error_message ?? null,
        created_at: new Date().toISOString(),
      };
      db.reminder_dispatches.push(d);
      persist();
      return clone(d);
    },
    async updateDispatch(id, patch) {
      const d = load().reminder_dispatches.find((r) => r.id === id);
      if (!d) return;
      Object.assign(d, patch);
      persist();
    },
    async updateDispatchByMessageId(messageId, patch) {
      const d = load().reminder_dispatches.find((r) => r.whatsapp_message_id === messageId);
      if (!d) return false;
      Object.assign(d, patch);
      persist();
      return true;
    },

    async findPartnerKeyByHash(hash) {
      return clone(load().partner_api_keys.find((k) => k.api_key_hash === hash) ?? null);
    },
  };
}

export type { ReminderDispatch };
