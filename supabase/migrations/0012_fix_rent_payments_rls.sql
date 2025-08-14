-- Fix RLS policies for rent_payments to allow app_member role to insert/update
-- This addresses the "new row violates row-level security policy" error

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS admin_write_rent ON rent_payments;

-- Create more permissive policies for rent_payments
-- Allow authenticated users (app_member and above) to read all rent payments
CREATE POLICY rent_payments_select ON rent_payments
  FOR SELECT USING (auth_role() IN ('app_member', 'app_manager', 'app_admin'));

-- Allow app_member and above to insert rent payments
CREATE POLICY rent_payments_insert ON rent_payments
  FOR INSERT WITH CHECK (auth_role() IN ('app_member', 'app_manager', 'app_admin'));

-- Allow app_member and above to update rent payments
CREATE POLICY rent_payments_update ON rent_payments
  FOR UPDATE USING (auth_role() IN ('app_member', 'app_manager', 'app_admin'))
  WITH CHECK (auth_role() IN ('app_member', 'app_manager', 'app_admin'));

-- Only allow admin roles to delete rent payments for data integrity
CREATE POLICY rent_payments_delete ON rent_payments
  FOR DELETE USING (auth_role() IN ('app_manager', 'app_admin'));

-- Also fix similar issues for other tables that might have the same problem
-- Fee payments (membership payments) should also be accessible to app_member
DROP POLICY IF EXISTS admin_write_fee ON fee_payments;

CREATE POLICY fee_payments_select ON fee_payments
  FOR SELECT USING (auth_role() IN ('app_member', 'app_manager', 'app_admin'));

CREATE POLICY fee_payments_insert ON fee_payments
  FOR INSERT WITH CHECK (auth_role() IN ('app_member', 'app_manager', 'app_admin'));

CREATE POLICY fee_payments_update ON fee_payments
  FOR UPDATE USING (auth_role() IN ('app_member', 'app_manager', 'app_admin'))
  WITH CHECK (auth_role() IN ('app_member', 'app_manager', 'app_admin'));

CREATE POLICY fee_payments_delete ON fee_payments
  FOR DELETE USING (auth_role() IN ('app_manager', 'app_admin'));

-- Membership subscriptions should also be accessible
DROP POLICY IF EXISTS admin_write_subscriptions ON membership_subscriptions;

CREATE POLICY membership_subscriptions_select ON membership_subscriptions
  FOR SELECT USING (auth_role() IN ('app_member', 'app_manager', 'app_admin'));

CREATE POLICY membership_subscriptions_insert ON membership_subscriptions
  FOR INSERT WITH CHECK (auth_role() IN ('app_member', 'app_manager', 'app_admin'));

CREATE POLICY membership_subscriptions_update ON membership_subscriptions
  FOR UPDATE USING (auth_role() IN ('app_member', 'app_manager', 'app_admin'))
  WITH CHECK (auth_role() IN ('app_member', 'app_manager', 'app_admin'));

CREATE POLICY membership_subscriptions_delete ON membership_subscriptions
  FOR DELETE USING (auth_role() IN ('app_manager', 'app_admin'));

-- Add read policies for related tables that users need to access
CREATE POLICY rental_agreements_select ON rental_agreements
  FOR SELECT USING (auth_role() IN ('app_member', 'app_manager', 'app_admin'));

CREATE POLICY properties_select ON properties
  FOR SELECT USING (auth_role() IN ('app_member', 'app_manager', 'app_admin'));

-- Ensure the auth_role function handles cases where no JWT is present
-- (for debugging and development)
CREATE OR REPLACE FUNCTION auth_role() 
RETURNS text 
LANGUAGE sql 
STABLE 
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    -- Try to get from current JWT claims
    (
      SELECT COALESCE(
        current_setting('request.jwt.claims', true)::jsonb->>'app_role',
        current_setting('request.jwt.claims', true)::jsonb->'app_metadata'->>'app_role'
      )
    ),
    -- Fallback for authenticated users without app_role set
    CASE 
      WHEN auth.uid() IS NOT NULL THEN 'app_member'
      ELSE 'app_anonymous'
    END
  );
$$;
