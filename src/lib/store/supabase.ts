import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Debtor, Invoice, InvoiceWithRelations, PartnerApiKey, ReminderDispatch, Tenant } from "@/types/wasool";
import type { WasoolStore } from "./types";

type Res<T> = { data: T | null; error: { message: string } | null };

function must<T>(res: Res<T>, ctx: string): T {
  if (res.error) throw new Error(`[supabase:${ctx}] ${res.error.message}`);
  return res.data as T;
}

// PostgREST may return NUMERIC as string; normalise.
function normInvoice<T extends Invoice>(inv: T): T {
  return { ...inv, amount_total_inr: Number(inv.amount_total_inr), amount_pending_inr: Number(inv.amount_pending_inr) };
}

function normRelations(row: InvoiceWithRelations): InvoiceWithRelations {
  return {
    ...normInvoice(row),
    dispatches: [...(row.dispatches ?? [])].sort((a, b) => a.scheduled_for.localeCompare(b.scheduled_for)),
  };
}

const INVOICE_WITH_RELATIONS = "*, debtor:debtors(*), tenant:tenants(*), dispatches:reminder_dispatches(*)";

export function createSupabaseStore(url: string, serviceRoleKey: string): WasoolStore {
  const db = createClient(url, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });

  return {
    mode: "supabase",

    async listTenants() {
      return must<Tenant[]>(await db.from("tenants").select("*").order("created_at"), "listTenants");
    },
    async getTenant(id) {
      return must<Tenant | null>(await db.from("tenants").select("*").eq("id", id).maybeSingle(), "getTenant");
    },
    async findTenantByPartner(partnerId, merchantId) {
      return must<Tenant | null>(
        await db
          .from("tenants")
          .select("*")
          .eq("partner_id", partnerId)
          .eq("partner_merchant_id", merchantId)
          .limit(1)
          .maybeSingle(),
        "findTenantByPartner",
      );
    },
    async upsertTenant(input) {
      return must<Tenant>(
        await db.from("tenants").upsert(input, { onConflict: "owner_email" }).select().single(),
        "upsertTenant",
      );
    },
    async updateTenant(id, patch) {
      return must<Tenant>(await db.from("tenants").update(patch).eq("id", id).select().single(), "updateTenant");
    },

    async upsertDebtor(input) {
      const row: Record<string, unknown> = { tenant_id: input.tenant_id, client_name: input.client_name, phone: input.phone };
      if (input.contact_person !== undefined) row.contact_person = input.contact_person;
      if (input.email !== undefined) row.email = input.email;
      return must<Debtor>(
        await db.from("debtors").upsert(row, { onConflict: "tenant_id,phone" }).select().single(),
        "upsertDebtor",
      );
    },

    async upsertInvoice(input) {
      // `status` is intentionally omitted so an upsert never resurrects a PAID invoice.
      const row: Record<string, unknown> = { ...input };
      if (input.external_invoice_id == null) delete row.external_invoice_id;
      if (input.autopilot_enabled === undefined) delete row.autopilot_enabled;
      const inv = must<Invoice>(
        await db.from("invoices").upsert(row, { onConflict: "tenant_id,invoice_number" }).select().single(),
        "upsertInvoice",
      );
      return normInvoice(inv);
    },
    async getInvoice(id) {
      const row = must<InvoiceWithRelations | null>(
        await db.from("invoices").select(INVOICE_WITH_RELATIONS).eq("id", id).maybeSingle(),
        "getInvoice",
      );
      return row ? normRelations(row) : null;
    },
    async findInvoice(tenantId, by) {
      let q = db.from("invoices").select("*").eq("tenant_id", tenantId);
      if (by.invoice_number) q = q.eq("invoice_number", by.invoice_number);
      else if (by.external_invoice_id) q = q.eq("external_invoice_id", by.external_invoice_id);
      else return null;
      const inv = must<Invoice | null>(await q.limit(1).maybeSingle(), "findInvoice");
      return inv ? normInvoice(inv) : null;
    },
    async listInvoices(tenantId) {
      let q = db.from("invoices").select(INVOICE_WITH_RELATIONS).order("due_date");
      if (tenantId) q = q.eq("tenant_id", tenantId);
      const rows = must<InvoiceWithRelations[]>(await q, "listInvoices");
      return rows.map(normRelations);
    },
    async updateInvoice(id, patch) {
      const inv = must<Invoice>(await db.from("invoices").update(patch).eq("id", id).select().single(), "updateInvoice");
      return normInvoice(inv);
    },

    async replaceQueuedDispatches(invoiceId, rows) {
      must(
        await db.from("reminder_dispatches").delete().eq("invoice_id", invoiceId).eq("delivery_status", "QUEUED"),
        "replaceQueuedDispatches:delete",
      );
      if (rows.length === 0) return;
      must(
        await db
          .from("reminder_dispatches")
          .insert(rows.map((r) => ({ invoice_id: invoiceId, tier: r.tier, scheduled_for: r.scheduled_for, delivery_status: "QUEUED" }))),
        "replaceQueuedDispatches:insert",
      );
    },
    async deleteQueuedDispatches(invoiceId) {
      const rows = must<ReminderDispatch[]>(
        await db
          .from("reminder_dispatches")
          .delete()
          .eq("invoice_id", invoiceId)
          .eq("delivery_status", "QUEUED")
          .select("id"),
        "deleteQueuedDispatches",
      );
      return rows?.length ?? 0;
    },
    async listDueDispatches(onOrBefore) {
      return must<ReminderDispatch[]>(
        await db
          .from("reminder_dispatches")
          .select("*")
          .eq("delivery_status", "QUEUED")
          .lte("scheduled_for", onOrBefore)
          .order("scheduled_for"),
        "listDueDispatches",
      );
    },
    async listRecentDispatches(limit, tenantId) {
      let q = db
        .from("reminder_dispatches")
        .select("*, invoice:invoices!inner(invoice_number, tenant_id, debtor:debtors(client_name))")
        .not("dispatched_at", "is", null)
        .order("dispatched_at", { ascending: false })
        .limit(limit);
      if (tenantId) q = q.eq("invoice.tenant_id", tenantId);
      type Row = ReminderDispatch & { invoice: { invoice_number: string; debtor: { client_name: string } | null } };
      const rows = must<Row[]>(await q, "listRecentDispatches");
      return rows.map(({ invoice, ...r }) => ({
        ...r,
        invoice_number: invoice.invoice_number,
        client_name: invoice.debtor?.client_name ?? "",
      }));
    },
    async insertDispatch(row) {
      return must<ReminderDispatch>(await db.from("reminder_dispatches").insert(row).select().single(), "insertDispatch");
    },
    async updateDispatch(id, patch) {
      must(await db.from("reminder_dispatches").update(patch).eq("id", id), "updateDispatch");
    },
    async updateDispatchByMessageId(messageId, patch) {
      const rows = must<Array<{ id: string }>>(
        await db.from("reminder_dispatches").update(patch).eq("whatsapp_message_id", messageId).select("id"),
        "updateDispatchByMessageId",
      );
      return (rows?.length ?? 0) > 0;
    },

    async findPartnerKeyByHash(hash) {
      return must<PartnerApiKey | null>(
        await db.from("partner_api_keys").select("*").eq("api_key_hash", hash).maybeSingle(),
        "findPartnerKeyByHash",
      );
    },
  };
}
