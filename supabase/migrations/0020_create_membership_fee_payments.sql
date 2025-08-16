-- Create membership_fee_payments table for tracking membership fee payments
CREATE TABLE membership_fee_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  payment_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  payment_method TEXT NOT NULL DEFAULT 'cash' CHECK (payment_method IN ('cash', 'card', 'upi', 'other')),
  receipt_number TEXT NOT NULL UNIQUE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create indexes for better performance
CREATE INDEX idx_membership_fee_payments_member_id ON membership_fee_payments(member_id);
CREATE INDEX idx_membership_fee_payments_payment_date ON membership_fee_payments(payment_date);
CREATE INDEX idx_membership_fee_payments_receipt_number ON membership_fee_payments(receipt_number);
CREATE INDEX idx_membership_fee_payments_created_by ON membership_fee_payments(created_by);

-- Create updated_at trigger
CREATE TRIGGER trigger_membership_fee_payments_updated_at
  BEFORE UPDATE ON membership_fee_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE membership_fee_payments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for membership_fee_payments
CREATE POLICY "membership_fee_payments_select" ON membership_fee_payments
  FOR SELECT USING (true);

CREATE POLICY "membership_fee_payments_insert" ON membership_fee_payments
  FOR INSERT WITH CHECK (true);

CREATE POLICY "membership_fee_payments_update" ON membership_fee_payments
  FOR UPDATE USING (true);

CREATE POLICY "membership_fee_payments_delete" ON membership_fee_payments
  FOR DELETE USING (true);

-- Add comment
COMMENT ON TABLE membership_fee_payments IS 'Tracks membership fee payments made by members';
COMMENT ON COLUMN membership_fee_payments.receipt_number IS 'Unique receipt number for the payment';
COMMENT ON COLUMN membership_fee_payments.amount IS 'Amount paid for membership fee';
COMMENT ON COLUMN membership_fee_payments.payment_method IS 'Method used for payment (cash, card, upi, other)';
