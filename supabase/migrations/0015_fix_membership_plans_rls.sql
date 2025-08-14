-- Fix RLS policies for membership_plans table
-- This addresses the "new row violates row-level security policy" error for membership plans

-- Drop any existing policies for membership_plans
DROP POLICY IF EXISTS "membership_plans_select" ON membership_plans;
DROP POLICY IF EXISTS "membership_plans_insert" ON membership_plans;
DROP POLICY IF EXISTS "membership_plans_update" ON membership_plans;
DROP POLICY IF EXISTS "membership_plans_delete" ON membership_plans;

-- Create comprehensive RLS policies for membership_plans table

-- Allow authenticated users to read all membership plans
CREATE POLICY "membership_plans_select" ON membership_plans
  FOR SELECT USING (auth_role() IN ('app_member', 'app_manager', 'app_admin'));

-- Allow app_manager and above to insert membership plans
-- (regular members shouldn't create new plans, only admins/managers)
CREATE POLICY "membership_plans_insert" ON membership_plans
  FOR INSERT WITH CHECK (auth_role() IN ('app_manager', 'app_admin'));

-- Allow app_manager and above to update membership plans
CREATE POLICY "membership_plans_update" ON membership_plans
  FOR UPDATE USING (auth_role() IN ('app_manager', 'app_admin'))
  WITH CHECK (auth_role() IN ('app_manager', 'app_admin'));

-- Only allow admin roles to delete membership plans for data integrity
CREATE POLICY "membership_plans_delete" ON membership_plans
  FOR DELETE USING (auth_role() IN ('app_admin'));

-- Ensure RLS is enabled on the membership_plans table
ALTER TABLE membership_plans ENABLE ROW LEVEL SECURITY;

-- Comment on the policies for documentation
COMMENT ON POLICY "membership_plans_select" ON membership_plans IS 'Allow all authenticated users to read membership plans';
COMMENT ON POLICY "membership_plans_insert" ON membership_plans IS 'Allow managers and admins to create new membership plans';
COMMENT ON POLICY "membership_plans_update" ON membership_plans IS 'Allow managers and admins to update membership plans';
COMMENT ON POLICY "membership_plans_delete" ON membership_plans IS 'Allow only admins to delete membership plans';
