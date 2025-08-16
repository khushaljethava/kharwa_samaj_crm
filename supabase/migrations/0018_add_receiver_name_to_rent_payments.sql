-- Add receiver_name field to rent_payments table
ALTER TABLE rent_payments 
ADD COLUMN IF NOT EXISTS receiver_name text;

COMMENT ON COLUMN rent_payments.receiver_name IS 'Name of the person who received the rent payment';

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_rent_payments_receiver_name ON rent_payments(receiver_name);
