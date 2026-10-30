-- ============================================================================
-- Wasool.io — Production Database Schema (PostgreSQL / Supabase)
-- Source: Product Blueprint §4. Additions vs. blueprint are marked "ADDED".
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tenants (Direct B2B Subscribers OR Embedded Partner Accounts)
CREATE TYPE tenant_type AS ENUM ('DIRECT_BUSINESS', 'INTEGRATION_PARTNER');

CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type tenant_type DEFAULT 'DIRECT_BUSINESS',
    partner_id VARCHAR(50), -- e.g., 'khatabook', 'mybillbook' if provisioned via Partner API
    partner_merchant_id VARCHAR(100), -- External ID from partner platform
    business_name VARCHAR(255) NOT NULL,
    brand_display_name VARCHAR(100) NOT NULL,
    owner_phone VARCHAR(20) NOT NULL,
    owner_email VARCHAR(255) UNIQUE NOT NULL,
    gstin VARCHAR(15),
    upi_vpa VARCHAR(100) NOT NULL, -- e.g., merchant@icici
    whatsapp_phone_number_id VARCHAR(100),
    plan_tier VARCHAR(50) DEFAULT 'starter', -- 'starter', 'growth', 'partner_embedded'
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Partner API Keys (For Platforms like Khatabook / Swipe)
CREATE TABLE partner_api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    partner_name VARCHAR(100) NOT NULL, -- e.g., 'Khatabook Production'
    partner_id VARCHAR(50), -- ADDED: binds a key to one partner slug (e.g. 'khatabook') so keys cannot act for other partners
    api_key_hash VARCHAR(255) UNIQUE NOT NULL, -- SHA-256 hex of the raw key
    key_prefix VARCHAR(16) NOT NULL, -- e.g., 'wsl_live_'
    webhook_secret VARCHAR(255) NOT NULL,
    rate_limit_per_min INT DEFAULT 1000,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Debtors (Clients who owe money)
CREATE TABLE debtors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    client_name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    phone VARCHAR(20) NOT NULL, -- Standardized E.164: +919876543210
    email VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (tenant_id, phone)
);

-- 4. Invoices
CREATE TYPE invoice_status AS ENUM ('PENDING', 'PARTIALLY_PAID', 'PAID', 'DISPUTED', 'CANCELLED');

CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    debtor_id UUID REFERENCES debtors(id) ON DELETE CASCADE,
    external_invoice_id VARCHAR(100), -- ID from Khatabook / Zoho / Tally
    invoice_number VARCHAR(100) NOT NULL,
    amount_total_inr NUMERIC(12, 2) NOT NULL,
    amount_pending_inr NUMERIC(12, 2) NOT NULL,
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    status invoice_status DEFAULT 'PENDING',
    payment_link_url TEXT,
    utr_reference VARCHAR(100),
    autopilot_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (tenant_id, invoice_number)
);

-- 5. Escalation Dispatch Logs
CREATE TYPE reminder_tier AS ENUM (
    'T_MINUS_2_COURTESY',
    'T_ZERO_DUE_DATE',
    'T_PLUS_3_RECONCILIATION',
    'T_PLUS_7_FORMAL_NOTICE',
    'T_PLUS_15_SUSPENSION_ALERT'
);

CREATE TABLE reminder_dispatches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
    tier reminder_tier NOT NULL,
    scheduled_for DATE NOT NULL,
    dispatched_at TIMESTAMP WITH TIME ZONE,
    whatsapp_message_id VARCHAR(150),
    delivery_status VARCHAR(50) DEFAULT 'QUEUED', -- 'QUEUED', 'SENT', 'DELIVERED', 'READ', 'FAILED', 'SKIPPED' (ADDED)
    error_message TEXT, -- ADDED: Meta API error body when delivery_status = 'FAILED'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance Indexes
CREATE INDEX idx_invoices_scheduler ON invoices(due_date, status) WHERE status = 'PENDING' AND autopilot_enabled = TRUE;
CREATE INDEX idx_dispatches_queue ON reminder_dispatches(scheduled_for, delivery_status) WHERE delivery_status = 'QUEUED';
-- ADDED: Meta delivery-status webhook looks dispatches up by message id
CREATE INDEX idx_dispatches_wamid ON reminder_dispatches(whatsapp_message_id) WHERE whatsapp_message_id IS NOT NULL;
-- ADDED: partner settle/sync looks merchants up by (partner_id, partner_merchant_id)
CREATE INDEX idx_tenants_partner ON tenants(partner_id, partner_merchant_id) WHERE partner_id IS NOT NULL;

-- ============================================================================
-- Row-Level Security (multi-tenant isolation)
-- Server routes use the service-role key (bypasses RLS). These policies
-- protect any direct client access made with a Supabase Auth user session:
-- a signed-in user can only see the tenant whose owner_email matches their
-- JWT email, and that tenant's debtors / invoices / dispatches.
-- ============================================================================
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_api_keys ENABLE ROW LEVEL SECURITY; -- no policies: service role only
ALTER TABLE debtors ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminder_dispatches ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_owner_select ON tenants
    FOR SELECT USING (owner_email = auth.jwt() ->> 'email');
CREATE POLICY tenant_owner_update ON tenants
    FOR UPDATE USING (owner_email = auth.jwt() ->> 'email');

CREATE POLICY debtors_tenant_isolation ON debtors
    FOR ALL USING (
        tenant_id IN (SELECT id FROM tenants WHERE owner_email = auth.jwt() ->> 'email')
    );

CREATE POLICY invoices_tenant_isolation ON invoices
    FOR ALL USING (
        tenant_id IN (SELECT id FROM tenants WHERE owner_email = auth.jwt() ->> 'email')
    );

CREATE POLICY dispatches_tenant_isolation ON reminder_dispatches
    FOR SELECT USING (
        invoice_id IN (
            SELECT i.id FROM invoices i
            JOIN tenants t ON t.id = i.tenant_id
            WHERE t.owner_email = auth.jwt() ->> 'email'
        )
    );
