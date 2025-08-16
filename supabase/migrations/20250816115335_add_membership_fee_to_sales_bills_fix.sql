-- Add membership_fee column to sales_bills table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'sales_bills' 
        AND column_name = 'membership_fee'
    ) THEN
        ALTER TABLE sales_bills 
        ADD COLUMN membership_fee DECIMAL(10,2) NOT NULL DEFAULT 0;
        
        -- Add comment for the new column
        COMMENT ON COLUMN sales_bills.membership_fee IS 'Membership fee amount for the bill';
    END IF;
END $$;

-- Update the total_amount calculation to include membership_fee if constraint doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE table_name = 'sales_bills' 
        AND constraint_name = 'check_total_amount'
    ) THEN
        ALTER TABLE sales_bills 
        ADD CONSTRAINT check_total_amount 
        CHECK (total_amount >= (subtotal + membership_fee - discount_amount + tax_amount));
    END IF;
END $$;
