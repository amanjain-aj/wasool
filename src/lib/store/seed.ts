import { createHash, randomUUID } from "node:crypto";
import type { Debtor, Invoice, PartnerApiKey, ReminderDispatch, Tenant } from "@/types/wasool";
import { addDays, dispatchSlotISO, todayIST } from "../dates";
import { buildUPILink } from "../upi";
import { ESCALATION_STAGES } from "../escalation";
import { DEMO_PARTNER_KEY } from "../config";

export interface LocalDb {
  version: number;
  seeded_on: string;
  tenants: Tenant[];
  partner_api_keys: PartnerApiKey[];
  debtors: Debtor[];
  invoices: Invoice[];
  reminder_dispatches: ReminderDispatch[];
}

export const LOCAL_DB_VERSION = 1;

/**
 * Realistic Indian B2B demo data. Due dates are relative to "today" so every
 * aging bucket is populated whenever the demo store is (re)seeded.
 */
export function buildSeed(today: string = todayIST()): LocalDb {
  const now = new Date().toISOString();

  const agency: Tenant = {
    id: randomUUID(),
    type: "DIRECT_BUSINESS",
    partner_id: null,
    partner_merchant_id: null,
    business_name: "Pixel & Pine Digital LLP",
    brand_display_name: "Pixel & Pine Digital",
    owner_phone: "+919811045566",
    owner_email: "accounts@pixelpine.in",
    gstin: "27AAQFP1234C1Z5",
    upi_vpa: "pixelpine@icici",
    whatsapp_phone_number_id: null,
    plan_tier: "growth",
    is_active: true,
    created_at: now,
  };

  const partnerMerchant: Tenant = {
    id: randomUUID(),
    type: "INTEGRATION_PARTNER",
    partner_id: "khatabook",
    partner_merchant_id: "kb_99281",
    business_name: "Sharma Traders",
    brand_display_name: "Sharma Traders",
    owner_phone: "+919876501234",
    owner_email: "kb_99281@khatabook.partner",
    gstin: null,
    upi_vpa: "sharmatraders@hdfcbank",
    whatsapp_phone_number_id: null,
    plan_tier: "partner_embedded",
    is_active: true,
    created_at: now,
  };

  const partnerKey: PartnerApiKey = {
    id: randomUUID(),
    partner_name: "Khatabook Sandbox (demo)",
    partner_id: "khatabook",
    api_key_hash: createHash("sha256").update(DEMO_PARTNER_KEY).digest("hex"),
    key_prefix: "wsl_live_",
    webhook_secret: "whsec_demo_khatabook",
    rate_limit_per_min: 1000,
    created_at: now,
  };

  type SeedRow = {
    tenant: Tenant;
    client: string;
    contact: string;
    phone: string;
    inv: string;
    total: number;
    pending?: number;
    dueOffset: number; // due date relative to today (negative = overdue)
    status?: Invoice["status"];
    utr?: string;
    autopilot?: boolean;
  };

  const rows: SeedRow[] = [
    { tenant: agency, client: "Zenith Logistics Pvt Ltd", contact: "Rohan Mehta", phone: "+919820145678", inv: "PP-2026-118", total: 85000, dueOffset: 6 },
    { tenant: agency, client: "Kaveri Foods & Beverages", contact: "Anitha Rao", phone: "+919845012345", inv: "PP-2026-121", total: 42500, dueOffset: 2 },
    { tenant: agency, client: "Orbit Fintech Solutions", contact: "Vikram Iyer", phone: "+919900112244", inv: "PP-2026-109", total: 118000, dueOffset: 0 },
    { tenant: agency, client: "Nimbus Realty Group", contact: "Priya Kapoor", phone: "+919811223344", inv: "PP-2026-102", total: 64900, dueOffset: -3 },
    { tenant: agency, client: "Saffron Hospitality", contact: "Arjun Nair", phone: "+919833445566", inv: "PP-2026-097", total: 29500, dueOffset: -7 },
    { tenant: agency, client: "Bluewave Edtech", contact: "Sneha Kulkarni", phone: "+919767889900", inv: "PP-2026-091", total: 150000, pending: 75000, dueOffset: -11, status: "PARTIALLY_PAID" },
    { tenant: agency, client: "Ganga Textiles Exports", contact: "Manoj Agarwal", phone: "+919415667788", inv: "PP-2026-078", total: 236000, dueOffset: -19 },
    { tenant: agency, client: "Crestline Healthcare", contact: "Dr. Farah Khan", phone: "+919987654321", inv: "PP-2026-064", total: 58999, dueOffset: -34, autopilot: false },
    { tenant: agency, client: "Urban Brew Cafés", contact: "Karan Singh", phone: "+919871234560", inv: "PP-2026-085", total: 35400, dueOffset: -9, status: "PAID", utr: "429817365520" },
    { tenant: agency, client: "Helix Pharma Distributors", contact: "Neha Joshi", phone: "+919822334455", inv: "PP-2026-080", total: 97350, dueOffset: -14, status: "PAID", utr: "431902218874" },
    { tenant: partnerMerchant, client: "Metro Retail Pvt Ltd", contact: "Suresh Patil", phone: "+919820112233", inv: "INV-2026-884", total: 64200, dueOffset: 16 },
    { tenant: partnerMerchant, client: "Shree Balaji Kirana", contact: "Ramesh Gupta", phone: "+919829011122", inv: "INV-2026-871", total: 18750, dueOffset: -4 },
  ];

  const debtors: Debtor[] = [];
  const invoices: Invoice[] = [];
  const dispatches: ReminderDispatch[] = [];

  for (const r of rows) {
    const debtor: Debtor = {
      id: randomUUID(),
      tenant_id: r.tenant.id,
      client_name: r.client,
      contact_person: r.contact,
      phone: r.phone,
      email: null,
      created_at: now,
    };
    debtors.push(debtor);

    const status = r.status ?? "PENDING";
    const pending = status === "PAID" ? 0 : r.pending ?? r.total;
    const dueDate = addDays(today, r.dueOffset);
    const invoice: Invoice = {
      id: randomUUID(),
      tenant_id: r.tenant.id,
      debtor_id: debtor.id,
      external_invoice_id: r.tenant.partner_id ? `kb_inv_${r.inv.split("-").pop()}` : null,
      invoice_number: r.inv,
      amount_total_inr: r.total,
      amount_pending_inr: pending,
      issue_date: addDays(dueDate, -30),
      due_date: dueDate,
      status,
      payment_link_url: buildUPILink(r.tenant.upi_vpa, r.tenant.brand_display_name, pending || r.total, r.inv),
      utr_reference: r.utr ?? null,
      autopilot_enabled: r.autopilot ?? true,
      created_at: now,
    };
    invoices.push(invoice);

    // History: stages already passed were "sent" at 10:30 IST on their date.
    // Today's & future stages stay QUEUED for the cron simulator.
    for (const stage of ESCALATION_STAGES) {
      const date = addDays(dueDate, stage.offsetDays);
      const isPast = date < today;
      if (status === "PAID" && !isPast) continue;
      if (!invoice.autopilot_enabled && !isPast) continue;
      dispatches.push({
        id: randomUUID(),
        invoice_id: invoice.id,
        tier: stage.tier,
        scheduled_for: date,
        dispatched_at: isPast ? dispatchSlotISO(date) : null,
        whatsapp_message_id: isPast ? `wamid.DEMO.${randomUUID().slice(0, 18)}` : null,
        delivery_status: isPast ? (stage.offsetDays < 3 ? "READ" : "DELIVERED") : "QUEUED",
        error_message: null,
        created_at: now,
      });
    }
  }

  return {
    version: LOCAL_DB_VERSION,
    seeded_on: today,
    tenants: [agency, partnerMerchant],
    partner_api_keys: [partnerKey],
    debtors,
    invoices,
    reminder_dispatches: dispatches,
  };
}
