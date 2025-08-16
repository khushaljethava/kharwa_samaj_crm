-- Create sales_categories table for managing item categories
CREATE TABLE IF NOT EXISTS sales_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT DEFAULT '#3B82F6',
  icon TEXT DEFAULT 'tag',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create indexes for better performance (only if they don't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_sales_categories_name') THEN
    CREATE INDEX idx_sales_categories_name ON sales_categories(name);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_sales_categories_is_active') THEN
    CREATE INDEX idx_sales_categories_is_active ON sales_categories(is_active);
  END IF;
END $$;

-- Create updated_at trigger for sales_categories (only if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_sales_categories_updated_at') THEN
    CREATE TRIGGER trigger_sales_categories_updated_at
      BEFORE UPDATE ON sales_categories
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Enable RLS
ALTER TABLE sales_categories ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for sales_categories (only if they don't exist)
DO $$
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Users can view all sales categories" ON sales_categories;
  DROP POLICY IF EXISTS "Users can insert sales categories" ON sales_categories;
  DROP POLICY IF EXISTS "Users can update sales categories" ON sales_categories;
  DROP POLICY IF EXISTS "Users can delete sales categories" ON sales_categories;
  
  -- Create new policies
  CREATE POLICY "Users can view all sales categories" 
    ON sales_categories FOR SELECT 
    USING (auth.role() = 'authenticated');

  CREATE POLICY "Users can insert sales categories" 
    ON sales_categories FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated');

  CREATE POLICY "Users can update sales categories" 
    ON sales_categories FOR UPDATE 
    USING (auth.role() = 'authenticated');

  CREATE POLICY "Users can delete sales categories" 
    ON sales_categories FOR DELETE 
    USING (auth.role() = 'authenticated');
END $$;

-- Insert some default categories
INSERT INTO sales_categories (name, description, color, icon) VALUES
  ('Beverages', 'Hot and cold drinks', '#3B82F6', 'coffee'),
  ('Snacks', 'Quick bites and snacks', '#F59E0B', 'cookie'),
  ('Food', 'Main course items', '#10B981', 'utensils'),
  ('Desserts', 'Sweet treats and desserts', '#EC4899', 'cake'),
  ('Groceries', 'Daily household items', '#8B5CF6', 'shopping-bag'),
  ('Electronics', 'Electronic items and gadgets', '#6366F1', 'smartphone'),
  ('Clothing', 'Apparel and accessories', '#EF4444', 'tshirt'),
  ('Books', 'Books and stationery', '#06B6D4', 'book-open')
ON CONFLICT (name) DO NOTHING;

-- For items without categories, assign to 'Other' category
-- First create 'Other' category if it doesn't exist
INSERT INTO sales_categories (name, description, color, icon) 
VALUES ('Other', 'Miscellaneous items', '#6B7280', 'package')
ON CONFLICT (name) DO NOTHING;

-- Update items without categories to use 'Other' category
UPDATE sales_items 
SET category = (
  SELECT id 
  FROM sales_categories 
  WHERE name = 'Other'
)
WHERE category IS NULL OR category = '';
