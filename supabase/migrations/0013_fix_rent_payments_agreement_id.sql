-- Fix rent_payments table to allow payments without specific rental agreements
-- This addresses the "null value in column agreement_id violates not-null constraint" error

-- First, let's make agreement_id nullable to support general rent payments
-- that don't belong to specific rental agreements
ALTER TABLE rent_payments 
ALTER COLUMN agreement_id DROP NOT NULL;

-- Update the comment to reflect the new behavior
COMMENT ON COLUMN rent_payments.agreement_id IS 'Optional reference to rental agreement. Can be NULL for general rent payments not tied to specific agreements.';

-- Drop the unique constraint that requires agreement_id
DROP INDEX IF EXISTS idx_rent_unique;

-- Create a new unique constraint that allows multiple entries for NULL agreement_id
-- but still prevents duplicates for specific agreement_id + payment_month combinations
CREATE UNIQUE INDEX idx_rent_unique_with_nulls ON rent_payments(agreement_id, payment_month) 
WHERE agreement_id IS NOT NULL;

-- Add an index for better performance on queries without agreement_id
CREATE INDEX idx_rent_payments_month ON rent_payments(payment_month);
CREATE INDEX idx_rent_payments_status ON rent_payments(status);

-- For data integrity, let's create a default "General" property and agreement
-- that can be used for rent payments that don't belong to specific agreements
INSERT INTO properties (id, property_code, property_details, status) 
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'GENERAL-RENT',
  '{"name": "General Rent Payments", "description": "Default property for general rent payments not tied to specific properties"}',
  'active'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO rental_agreements (id, property_id, agreement_details, start_date, monthly_rent, status)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  '{"type": "general", "description": "Default agreement for general rent payments"}',
  '2020-01-01',
  0,
  'active'
) ON CONFLICT (id) DO NOTHING;

-- Update the API to use the default agreement when none is provided
-- This will be handled in the application code

-- Also fix the foreign key constraint to be less restrictive
ALTER TABLE rent_payments 
DROP CONSTRAINT IF EXISTS rent_payments_agreement_id_fkey;

ALTER TABLE rent_payments 
ADD CONSTRAINT rent_payments_agreement_id_fkey 
FOREIGN KEY (agreement_id) 
REFERENCES rental_agreements(id) 
ON DELETE SET NULL;  -- If agreement is deleted, set payment's agreement_id to NULL

-- Add a function to get or create the default agreement ID
CREATE OR REPLACE FUNCTION get_default_agreement_id() 
RETURNS uuid 
LANGUAGE sql 
STABLE 
AS $$
  SELECT '00000000-0000-0000-0000-000000000001'::uuid;
$$;

