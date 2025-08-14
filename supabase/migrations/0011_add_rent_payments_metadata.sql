-- Add missing metadata column to rent_payments table
-- This migration fixes the schema inconsistency where the metadata column is missing

-- Check if the metadata column exists, and add it if it doesn't
DO $$
BEGIN
    -- Add metadata column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'rent_payments' 
        AND column_name = 'metadata'
    ) THEN
        ALTER TABLE rent_payments 
        ADD COLUMN metadata jsonb NOT NULL DEFAULT '{}'::jsonb;
        
        -- Add comment
        COMMENT ON COLUMN rent_payments.metadata IS 'Additional metadata for rent payments including source_id and other custom fields';
    END IF;

    -- Also ensure other columns from 0005_schema.sql are present
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'rent_payments' 
        AND column_name = 'receipt_number'
    ) THEN
        ALTER TABLE rent_payments 
        ADD COLUMN receipt_number text UNIQUE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'rent_payments' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE rent_payments 
        ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();
    END IF;

    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'rent_payments' 
        AND column_name = 'received_by'
    ) THEN
        ALTER TABLE rent_payments 
        ADD COLUMN received_by uuid REFERENCES auth.users(id);
    END IF;

    -- Update constraints and defaults to match 0005_schema.sql
    -- Change default status from 'pending' to 'due'
    ALTER TABLE rent_payments 
    ALTER COLUMN status SET DEFAULT 'due';

    -- Add check constraints if they don't exist
    BEGIN
        ALTER TABLE rent_payments 
        ADD CONSTRAINT rent_payments_amount_due_check CHECK (amount_due >= 0);
    EXCEPTION 
        WHEN duplicate_object THEN NULL;
    END;

    BEGIN
        ALTER TABLE rent_payments 
        ADD CONSTRAINT rent_payments_amount_paid_check CHECK (amount_paid >= 0);
    EXCEPTION 
        WHEN duplicate_object THEN NULL;
    END;

    -- Update foreign key constraint to match 0005_schema.sql (restrict instead of cascade)
    -- This requires dropping and recreating the constraint
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE table_name = 'rent_payments' 
        AND constraint_name = 'rent_payments_agreement_id_fkey'
    ) THEN
        ALTER TABLE rent_payments 
        DROP CONSTRAINT rent_payments_agreement_id_fkey;
        
        ALTER TABLE rent_payments 
        ADD CONSTRAINT rent_payments_agreement_id_fkey 
        FOREIGN KEY (agreement_id) 
        REFERENCES rental_agreements(id) 
        ON DELETE RESTRICT;
    END IF;

END $$;
