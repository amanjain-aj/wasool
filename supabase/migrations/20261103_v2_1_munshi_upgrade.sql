-- ============================================================================
-- Wasool.io v2.1 — Incremental Upgrade & Architecture Blueprint Migration
-- Non-Destructive feature layering on top of v1.0 and v2.0
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
DO $$ BEGIN
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

-- Safely ensure statuses exist on invoice_status enum
ALTER TYPE invoice_status ADD VALUE IF NOT EXISTS 'AWAITING_OWNER_APPROVAL';
ALTER TYPE invoice_status ADD VALUE IF NOT EXISTS 'AWAITING_CONTACT_CARD';
ALTER TYPE invoice_status ADD VALUE IF NOT EXISTS 'PAUSED';

-- If bill_doc_type already existed from v2.0, add the new enum values safely
ALTER TYPE bill_doc_type ADD VALUE IF NOT EXISTS 'KHATABOOK_REPORT';
ALTER TYPE bill_doc_type ADD VALUE IF NOT EXISTS 'HANDWRITTEN_DIARY';

ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS submitted_by_phone VARCHAR(20),
  ADD COLUMN IF NOT EXISTS batch_import_id UUID, -- Groups rows imported from a single Khatabook PDF or Diary page
  ADD COLUMN IF NOT EXISTS doc_type bill_doc_type DEFAULT 'GST_INVOICE',
  ADD COLUMN IF NOT EXISTS media_storage_url TEXT,
  ADD COLUMN IF NOT EXISTS media_mime_type VARCHAR(50),
  ADD COLUMN IF NOT EXISTS amount_kattauti_tds_inr NUMERIC(12, 2) DEFAULT 0.00;

-- 5. Create Ephemeral Contact-Card Pairing State Table (Links shared vCards to voice notes/bills)
CREATE TABLE IF NOT EXISTS whatsapp_session_context (
    sender_phone VARCHAR(20) PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    last_shared_contact_name VARCHAR(255),
    last_shared_contact_phone VARCHAR(20),
    pending_invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Create UTR & Payment Screenshot Reconciliation Table
DO $$ BEGIN
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

CREATE INDEX IF NOT EXISTS idx_invoices_batch_import ON invoices(batch_import_id);
CREATE INDEX IF NOT EXISTS idx_reconciliations_invoice_status ON payment_reconciliations(invoice_id, status);
