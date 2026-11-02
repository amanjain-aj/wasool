-- ============================================================================
-- Wasool.io v2.0 — Headless WhatsApp Munshi Incremental Upgrade Migration
-- Targets existing v1.0 schema non-destructively with IF NOT EXISTS guards
-- ============================================================================

-- Enable UUID extension if not present
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Upgrade Tenants Table for Munshi Preferences & NEFT Details
ALTER TABLE tenants 
  ADD COLUMN IF NOT EXISTS bank_account_details TEXT,
  ADD COLUMN IF NOT EXISTS preferred_language VARCHAR(20) DEFAULT 'HINGLISH',
  ADD COLUMN IF NOT EXISTS morning_digest_enabled BOOLEAN DEFAULT TRUE;

-- 2. Create Authorized Staff / Dispatch Clerk Table (Multi-Actor Ingestion)
CREATE TABLE IF NOT EXISTS tenant_staff (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    staff_name VARCHAR(100) NOT NULL,
    staff_phone VARCHAR(20) UNIQUE NOT NULL, -- Format: +9198XXXXXXXX
    require_owner_approval BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Upgrade Debtors Table for 1-Tap Hold/Pause
DO $$ 
BEGIN 
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'debtors') THEN 
    ALTER TABLE debtors ADD COLUMN IF NOT EXISTS is_paused_until DATE; 
  ELSIF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'clients') THEN 
    ALTER TABLE clients ADD COLUMN IF NOT EXISTS is_paused_until DATE; 
  END IF; 
END $$;

-- 4. Upgrade Invoices Table for Multimodal Ingestion, Media Headers & Kattauti/TDS
DO $$ 
BEGIN 
  CREATE TYPE bill_doc_type AS ENUM ('GST_INVOICE', 'DELIVERY_CHALLAN', 'KACCHA_ESTIMATE', 'VOICE_ENTRY'); 
EXCEPTION 
  WHEN duplicate_object THEN null; 
END $$;

-- Add 'AWAITING_OWNER_APPROVAL' and 'PAUSED' to existing invoice_status enum safely
ALTER TYPE invoice_status ADD VALUE IF NOT EXISTS 'AWAITING_OWNER_APPROVAL';
ALTER TYPE invoice_status ADD VALUE IF NOT EXISTS 'PAUSED';

ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS submitted_by_phone VARCHAR(20),
  ADD COLUMN IF NOT EXISTS doc_type bill_doc_type DEFAULT 'GST_INVOICE',
  ADD COLUMN IF NOT EXISTS media_storage_url TEXT,
  ADD COLUMN IF NOT EXISTS media_mime_type VARCHAR(50),
  ADD COLUMN IF NOT EXISTS amount_kattauti_tds_inr NUMERIC(12, 2) DEFAULT 0.00;

-- 5. Create UTR & Payment Screenshot Reconciliation Table
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

CREATE INDEX IF NOT EXISTS idx_reconciliations_invoice_status ON payment_reconciliations(invoice_id, status);
