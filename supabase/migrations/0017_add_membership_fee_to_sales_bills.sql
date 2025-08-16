-- Add membership_fee column to sales_bills table
ALTER TABLE sales_bills 
ADD COLUMN membership_fee DECIMAL(10,2) NOT NULL DEFAULT 0;

-- Add comment for the new column
COMMENT ON COLUMN sales_bills.membership_fee IS 'Membership fee amount for the bill';

-- Update the total_amount calculation to include membership_fee
-- Note: This is a data integrity check, the actual calculation is done in the application
ALTER TABLE sales_bills 
ADD CONSTRAINT check_total_amount 
CHECK (total_amount >= (subtotal + membership_fee - discount_amount + tax_amount));
