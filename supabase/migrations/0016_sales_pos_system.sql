-- Create sales_bills table for POS transactions
CREATE TABLE sales_bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_number TEXT NOT NULL UNIQUE,
  customer_name TEXT,
  customer_phone TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  payment_method TEXT DEFAULT 'cash' CHECK (payment_method IN ('cash', 'card', 'upi', 'other', 'membership')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create sales_items table for managing items available for sale (WITHOUT price column)
CREATE TABLE sales_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  product_items TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create indexes for better performance
CREATE INDEX idx_sales_bills_bill_number ON sales_bills(bill_number);
CREATE INDEX idx_sales_bills_created_at ON sales_bills(created_at);
CREATE INDEX idx_sales_bills_customer_name ON sales_bills(customer_name);
CREATE INDEX idx_sales_items_name ON sales_items(name);
CREATE INDEX idx_sales_items_category ON sales_items(category);
CREATE INDEX idx_sales_items_is_active ON sales_items(is_active);

-- Create function to auto-generate bill number
CREATE OR REPLACE FUNCTION generate_bill_number()
RETURNS TEXT AS $$
DECLARE
  current_year TEXT;
  current_month TEXT;
  sequence_num INTEGER;
  bill_num TEXT;
BEGIN
  current_year := EXTRACT(YEAR FROM NOW())::TEXT;
  current_month := LPAD(EXTRACT(MONTH FROM NOW())::TEXT, 2, '0');
  
  -- Get the next sequence number for this month/year
  SELECT COALESCE(MAX(CAST(SUBSTRING(bill_number FROM '\d+$') AS INTEGER)), 0) + 1
  INTO sequence_num
  FROM sales_bills
  WHERE bill_number LIKE 'BILL-' || current_year || current_month || '%';
  
  bill_num := 'BILL-' || current_year || current_month || LPAD(sequence_num::TEXT, 4, '0');
  
  RETURN bill_num;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate bill number
CREATE OR REPLACE FUNCTION set_bill_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.bill_number IS NULL OR NEW.bill_number = '' THEN
    NEW.bill_number := generate_bill_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_bill_number
  BEFORE INSERT ON sales_bills
  FOR EACH ROW
  EXECUTE FUNCTION set_bill_number();

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_sales_bills_updated_at
  BEFORE UPDATE ON sales_bills
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_sales_items_updated_at
  BEFORE UPDATE ON sales_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE sales_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for sales_bills
CREATE POLICY "Users can view all sales bills" 
  ON sales_bills FOR SELECT 
  USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert sales bills" 
  ON sales_bills FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own sales bills" 
  ON sales_bills FOR UPDATE 
  USING (created_by = auth.uid() OR auth.role() = 'authenticated');

CREATE POLICY "Users can delete their own sales bills" 
  ON sales_bills FOR DELETE 
  USING (created_by = auth.uid() OR auth.role() = 'authenticated');

-- Create RLS policies for sales_items
CREATE POLICY "Users can view all sales items" 
  ON sales_items FOR SELECT 
  USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert sales items" 
  ON sales_items FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update sales items" 
  ON sales_items FOR UPDATE 
  USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete sales items" 
  ON sales_items FOR DELETE 
  USING (auth.role() = 'authenticated');

-- Insert some sample items to get started (WITHOUT price column)
INSERT INTO sales_items (name, description, category, product_items) VALUES
  ('Tea', 'Regular tea (price varies)', 'Beverages', '{"Tea Powder", "Sugar", "Milk"}'),
  ('Coffee', 'Regular coffee (price varies)', 'Beverages', '{"Coffee Powder", "Sugar", "Milk"}'),
  ('Samosa', 'Fried snack (price varies)', 'Snacks', '{}'),
  ('Vada Pav', 'Mumbai street food (price varies)', 'Food', '{}'),
  ('Cold Drink', 'Soft drink bottle (price varies)', 'Beverages', '{}'),
  ('Biscuits', 'Tea time biscuits (price varies)', 'Snacks', '{}');
