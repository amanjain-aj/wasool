import type {
  DebtorInput,
  Debtor,
  DeliveryStatus,
  Invoice,
  InvoiceInput,
  InvoiceWithRelations,
  PartnerApiKey,
  ReminderDispatch,
  ScheduledReminder,
  Tenant,
  TenantInput,
} from "@/types/wasool";

export type InvoicePatch = Partial<
  Pick<
    Invoice,
    | "status"
    | "amount_pending_inr"
    | "payment_link_url"
    | "utr_reference"
    | "autopilot_enabled"
    | "batch_import_id"
    | "doc_type"
    | "media_storage_url"
    | "media_mime_type"
    | "amount_kattauti_tds_inr"
  >
>;

export type DispatchPatch = Partial<
  Pick<ReminderDispatch, "delivery_status" | "dispatched_at" | "whatsapp_message_id" | "error_message">
>;

export interface NewDispatch {
  invoice_id: string;
  tier: ReminderDispatch["tier"];
  scheduled_for: string;
  delivery_status: DeliveryStatus;
  dispatched_at?: string | null;
  whatsapp_message_id?: string | null;
  error_message?: string | null;
}

/**
 * Repository contract implemented by both the Supabase (production) store and
 * the local JSON demo store.
 */
export interface WasoolStore {
  readonly mode: "supabase" | "local";

  listTenants(): Promise<Tenant[]>;
  getTenant(id: string): Promise<Tenant | null>;
  findTenantByPartner(partnerId: string, merchantId: string): Promise<Tenant | null>;
  /** Insert, or update on conflict(owner_email). */
  upsertTenant(input: TenantInput): Promise<Tenant>;
  updateTenant(id: string, patch: Partial<TenantInput>): Promise<Tenant>;

  /** Insert, or update on conflict(tenant_id, phone). */
  upsertDebtor(input: DebtorInput): Promise<Debtor>;

  /** Insert, or update on conflict(tenant_id, invoice_number). Status is preserved on update. */
  upsertInvoice(input: InvoiceInput): Promise<Invoice>;
  getInvoice(id: string): Promise<InvoiceWithRelations | null>;
  findInvoice(tenantId: string, by: { invoice_number?: string; external_invoice_id?: string }): Promise<Invoice | null>;
  listInvoices(tenantId?: string): Promise<InvoiceWithRelations[]>;
  updateInvoice(id: string, patch: InvoicePatch): Promise<Invoice>;

  /** Deletes the invoice's QUEUED dispatches and inserts the new schedule. */
  replaceQueuedDispatches(invoiceId: string, rows: ScheduledReminder[]): Promise<void>;
  /** Returns the number of QUEUED rows removed. */
  deleteQueuedDispatches(invoiceId: string): Promise<number>;
  listDueDispatches(onOrBefore: string): Promise<ReminderDispatch[]>;
  listRecentDispatches(limit: number, tenantId?: string): Promise<Array<ReminderDispatch & { invoice_number: string; client_name: string }>>;
  insertDispatch(row: NewDispatch): Promise<ReminderDispatch>;
  updateDispatch(id: string, patch: DispatchPatch): Promise<void>;
  updateDispatchByMessageId(messageId: string, patch: DispatchPatch): Promise<boolean>;

  findPartnerKeyByHash(hash: string): Promise<PartnerApiKey | null>;

  // v2.0 Munshi additions
  findTenantByPhone(phone: string): Promise<Tenant | null>;
  findStaffByPhone(phone: string): Promise<{ staff: any; tenant: Tenant } | null>;
  findDebtorByPhone(phone: string): Promise<{ debtor: Debtor; activeInvoices: InvoiceWithRelations[] } | null>;
  pauseDebtor(debtorId: string, untilDateISO: string): Promise<void>;
  createReconciliation(input: {
    invoice_id: string;
    reported_amount_inr: number;
    utr_or_cheque_number: string;
    proof_media_url?: string | null;
  }): Promise<any>;
  getReconciliation(id: string): Promise<any | null>;
  updateReconciliation(id: string, patch: any): Promise<void>;

  // v2.1 WhatsApp Munshi Additions
  getSessionContext(senderPhone: string): Promise<any | null>;
  setSessionContext(senderPhone: string, tenantId: string, patch: any): Promise<void>;
  clearSessionContext(senderPhone: string): Promise<void>;
  approveBatch(batchImportId: string): Promise<number>;
  findDebtorByNameFuzzy(tenantId: string, name: string): Promise<Debtor | null>;
}
