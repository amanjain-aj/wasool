// Domain types mirroring supabase/schema.sql

export type TenantType = "DIRECT_BUSINESS" | "INTEGRATION_PARTNER";
export type InvoiceStatus = "PENDING" | "PARTIALLY_PAID" | "PAID" | "DISPUTED" | "CANCELLED";
export type ReminderTier =
  | "T_MINUS_2_COURTESY"
  | "T_ZERO_DUE_DATE"
  | "T_PLUS_3_RECONCILIATION"
  | "T_PLUS_7_FORMAL_NOTICE"
  | "T_PLUS_15_SUSPENSION_ALERT";
export type DeliveryStatus = "QUEUED" | "SENT" | "DELIVERED" | "READ" | "FAILED" | "SKIPPED";
export type PlanTier = "starter" | "growth" | "partner_embedded";

export interface Tenant {
  id: string;
  type: TenantType;
  partner_id: string | null;
  partner_merchant_id: string | null;
  business_name: string;
  brand_display_name: string;
  owner_phone: string;
  owner_email: string;
  gstin: string | null;
  upi_vpa: string;
  whatsapp_phone_number_id: string | null;
  plan_tier: PlanTier | string;
  is_active: boolean;
  created_at: string;
}

export interface PartnerApiKey {
  id: string;
  partner_name: string;
  partner_id: string | null;
  api_key_hash: string;
  key_prefix: string;
  webhook_secret: string;
  rate_limit_per_min: number;
  created_at: string;
}

export interface Debtor {
  id: string;
  tenant_id: string;
  client_name: string;
  contact_person: string | null;
  phone: string;
  email: string | null;
  created_at: string;
}

export interface Invoice {
  id: string;
  tenant_id: string;
  debtor_id: string;
  external_invoice_id: string | null;
  invoice_number: string;
  amount_total_inr: number;
  amount_pending_inr: number;
  issue_date: string; // YYYY-MM-DD
  due_date: string; // YYYY-MM-DD
  status: InvoiceStatus;
  payment_link_url: string | null;
  utr_reference: string | null;
  autopilot_enabled: boolean;
  created_at: string;
}

export interface ReminderDispatch {
  id: string;
  invoice_id: string;
  tier: ReminderTier;
  scheduled_for: string; // YYYY-MM-DD
  dispatched_at: string | null;
  whatsapp_message_id: string | null;
  delivery_status: DeliveryStatus;
  error_message: string | null;
  created_at: string;
}

export interface InvoiceWithRelations extends Invoice {
  debtor: Debtor;
  tenant: Tenant;
  dispatches: ReminderDispatch[];
}

// ---- Upsert inputs -------------------------------------------------------

export type TenantInput = Omit<Tenant, "id" | "created_at" | "type" | "plan_tier" | "is_active" | "partner_id" | "partner_merchant_id" | "gstin" | "whatsapp_phone_number_id"> &
  Partial<Pick<Tenant, "type" | "plan_tier" | "is_active" | "partner_id" | "partner_merchant_id" | "gstin" | "whatsapp_phone_number_id">>;

export interface DebtorInput {
  tenant_id: string;
  client_name: string;
  phone: string;
  contact_person?: string | null;
  email?: string | null;
}

export interface InvoiceInput {
  tenant_id: string;
  debtor_id: string;
  external_invoice_id?: string | null;
  invoice_number: string;
  amount_total_inr: number;
  amount_pending_inr: number;
  issue_date: string;
  due_date: string;
  payment_link_url: string | null;
  autopilot_enabled?: boolean;
}

export interface ScheduledReminder {
  tier: ReminderTier;
  scheduled_for: string;
}

// ---- API payloads ----------------------------------------------------------

export interface PartnerSyncPayload {
  partner_id: string;
  merchant: {
    id: string;
    business_name: string;
    upi_vpa: string;
    phone?: string;
    email?: string;
    gstin?: string;
  };
  debtor: {
    name: string;
    phone: string;
    contact_person?: string;
    email?: string;
  };
  invoice: {
    number: string;
    external_id?: string;
    amount_total?: number;
    amount_pending: number;
    issue_date?: string;
    due_date: string;
  };
}

export interface PartnerSettlePayload {
  partner_id: string;
  merchant_id: string;
  invoice_number?: string;
  external_invoice_id?: string;
  utr_reference: string;
  amount_paid?: number;
}

export interface CsvInvoiceRow {
  client_name: string;
  phone: string;
  invoice_number: string;
  amount_total: number | string;
  amount_pending?: number | string;
  issue_date?: string;
  due_date: string;
  contact_person?: string;
  email?: string;
}

export interface DispatchRunSummary {
  run_date: string;
  mode: "live" | "dry-run";
  evaluated: number;
  sent: number;
  failed: number;
  skipped: number;
  results: Array<{
    invoice_id: string;
    invoice_number: string;
    client_name: string;
    tier: ReminderTier;
    status: DeliveryStatus;
    whatsapp_message_id?: string | null;
    error?: string;
  }>;
}
