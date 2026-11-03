-- ============================================================================
-- Wasool.io v2.1 — Complete Production Database Upgrade Migration
-- Enables:
-- 1. Strict Registration Gating (is_registered, registration_step, subscription_plan)
-- 2. Multi-Actor Dispatch Clerk Ingestion (tenant_staff)
-- 3. Debtors 1-Tap Pause (is_paused_until)
-- 4. Multimodal Bill Types & Batch Import Invoices (doc_type, media headers, batch_import_id, TDS math)
-- 5. WhatsApp Contact Card Session Context (whatsapp_session_context)
-- 6. UTR Screenshot & Cheque Reconciliation (payment_reconciliations)
-- 7. Super-Admin Audit & Activity Logs (admin_audit_logs)
-- ============================================================================

-- Enable UUID extension if not present
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Upgrade Tenants Table for Munshi Preferences, Registration Gating & NEFT Details
ALTER TABLE tenants 
  ADD COLUMN IF NOT EXISTS is_registered BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS registration_step VARCHAR(50) DEFAULT 'PENDING_PHONE',
  ADD COLUMN IF NOT EXISTS subscription_plan VARCHAR(50) DEFAULT 'FREE_TRIAL',
  ADD COLUMN IF NOT EXISTS bank_account_details TEXT,
  ADD COLUMN IF NOT EXISTS preferred_language VARCHAR(20) DEFAULT 'HINGLISH',
  ADD COLUMN IF NOT EXISTS morning_digest_enabled BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- 2. Create Authorized Staff / Dispatch Clerk Table (Multi-Actor Ingestion)
CREATE TABLE IF NOT EXISTS tenant_staff (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    staff_name VARCHAR(100) NOT NULL,
    staff_phone VARCHAR(20) UNIQUE NOT NULL,
    require_owner_approval BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Upgrade Debtors / Clients Table for 1-Tap Hold/Pause
DO $$ 
BEGIN 
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'debtors') THEN 
    ALTER TABLE debtors ADD COLUMN IF NOT EXISTS is_paused_until DATE; 
  ELSIF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'clients') THEN 
    ALTER TABLE clients ADD COLUMN IF NOT EXISTS is_paused_until DATE; 
  END IF; 
END $$;

-- 4. Upgrade Invoices Table for Multimodal Ingestion, Bulk Imports, Media Headers & Kattauti/TDS
DO $$ 
BEGIN 
  CREATE TYPE bill_doc_type AS ENUM (
    'GST_INVOICE', 
    'DELIVERY_CHALLAN', 
    'KACCHA_ESTIMATE', 
    'VOICE_ENTRY', 
    'KHATABOOK_REPORT', 
    'HANDWRITTEN_DIARY'
  ); 
EXCEPTION 
  WHEN duplicate_object THEN null; 
END $$;

DO $$ 
BEGIN
  ALTER TYPE invoice_status ADD VALUE IF NOT EXISTS 'AWAITING_OWNER_APPROVAL';
  ALTER TYPE invoice_status ADD VALUE IF NOT EXISTS 'AWAITING_CONTACT_CARD';
  ALTER TYPE invoice_status ADD VALUE IF NOT EXISTS 'PAUSED';
EXCEPTION 
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS submitted_by_phone VARCHAR(20),
  ADD COLUMN IF NOT EXISTS batch_import_id UUID,
  ADD COLUMN IF NOT EXISTS doc_type bill_doc_type DEFAULT 'GST_INVOICE',
  ADD COLUMN IF NOT EXISTS media_storage_url TEXT,
  ADD COLUMN IF NOT EXISTS media_mime_type VARCHAR(50),
  ADD COLUMN IF NOT EXISTS amount_kattauti_tds_inr NUMERIC(12, 2) DEFAULT 0.00;

-- 5. Create Ephemeral Contact-Card Pairing State Table
CREATE TABLE IF NOT EXISTS whatsapp_session_context (
    sender_phone VARCHAR(20) PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    last_shared_contact_name VARCHAR(255),
    last_shared_contact_phone VARCHAR(20),
    pending_invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Create UTR & Payment Screenshot Reconciliation Table
DO $$ 
BEGIN 
  CREATE TYPE settlement_status AS ENUM ('PENDING_OWNER_CONFIRMATION', 'CONFIRMED', 'REJECTED'); 
EXCEPTION 
  WHEN duplicate_object THEN null; 
END $$;

CREATE TABLE IF NOT EXISTS payment_reconciliations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
    reported_amount_inr NUMERIC(12, 2) NOT NULL,
    utr_or_cheque_number VARCHAR(100),
    proof_media_url TEXT,
    status settlement_status DEFAULT 'PENDING_OWNER_CONFIRMATION',
    confirmed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Create Super-Admin Audit & Activity Logs Table
CREATE TABLE IF NOT EXISTS admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_email VARCHAR(255) NOT NULL,
    action_type VARCHAR(100) NOT NULL,
    target_tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_invoices_batch_import ON invoices(batch_import_id);
CREATE INDEX IF NOT EXISTS idx_reconciliations_invoice_status ON payment_reconciliations(invoice_id, status);
CREATE INDEX IF NOT EXISTS idx_tenants_is_registered ON tenants(is_registered);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created ON admin_audit_logs(created_at DESC);
