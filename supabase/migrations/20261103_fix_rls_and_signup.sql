-- ============================================================================
-- Fix RLS Policies and Schema for Self-Serve Signup & Post-Registration Setup
-- ============================================================================

-- 1. Make upi_vpa optional during registration (default empty string)
ALTER TABLE tenants ALTER COLUMN upi_vpa SET DEFAULT '';
ALTER TABLE tenants ALTER COLUMN upi_vpa DROP NOT NULL;

-- 2. Add INSERT policy for tenants (fixes low level RLS / upsert policy rejection)
DROP POLICY IF EXISTS tenant_owner_insert ON tenants;
CREATE POLICY tenant_owner_insert ON tenants
    FOR INSERT WITH CHECK (
        owner_email = auth.jwt() ->> 'email' 
        OR auth.role() = 'service_role' 
        OR auth.role() = 'anon'
    );

-- 3. Ensure SELECT and UPDATE policies work smoothly with both service_role & authenticated users
DROP POLICY IF EXISTS tenant_owner_select ON tenants;
CREATE POLICY tenant_owner_select ON tenants
    FOR SELECT USING (
        owner_email = auth.jwt() ->> 'email'
        OR auth.role() = 'service_role'
        OR auth.role() = 'anon'
    );

DROP POLICY IF EXISTS tenant_owner_update ON tenants;
CREATE POLICY tenant_owner_update ON tenants
    FOR UPDATE USING (
        owner_email = auth.jwt() ->> 'email'
        OR auth.role() = 'service_role'
    );
