-- Ensure uuid-ossp extension is enabled for uuid_generate_v4()
create extension if not exists "uuid-ossp";

-- Relationship Type Enum
do $$ begin
  create type relationship_type as enum (
    'parent_child',
    'spousal',
    'sibling',
    'extended_family',
    'in_law',
    'guardian'
  );
exception when duplicate_object then null; end $$;


-- 1. members table
create table if not exists members (
  id uuid primary key default uuid_generate_v4(),
  member_code text unique, -- unique, auto-generated - logic to be implemented in app or via trigger
  personal_info jsonb not null default '{}'::jsonb, -- Full legal name, date of birth, gender, blood group, etc.
  contact_info jsonb not null default '{}'::jsonb, -- phone numbers, email addresses
  address_info jsonb not null default '{}'::jsonb, -- current, permanent, native place
  membership_info jsonb not null default '{}'::jsonb, -- membership status, member since date, plan info
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id), -- assuming integration with Supabase auth users
  updated_by uuid references auth.users(id),
  is_active boolean not null default true,
  is_deceased boolean not null default false,
  metadata jsonb not null default '{}'::jsonb -- for custom fields
);

comment on table members is 'Stores information about community members.';


-- 2. relationships table
create table if not exists relationships (
  id uuid primary key default uuid_generate_v4(),
  member_1_id uuid not null references members(id) on delete cascade,
  member_2_id uuid not null references members(id) on delete cascade,
  relationship_type relationship_type not null,
  relationship_status text, -- e.g., 'active', 'separated', 'divorced', 'widowed'
  start_date date,
  end_date date,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id),

  -- Ensure unique relationship between two members of a specific type
  -- Note: This doesn't prevent (A,B,spouse) and (B,A,spouse), which might need app-level logic or a more complex constraint/trigger.
  unique (member_1_id, member_2_id, relationship_type)
);

comment on table relationships is 'Tracks relationships between members.';


-- 3. inventory_items table
create table if not exists inventory_items (
  id uuid primary key default uuid_generate_v4(),
  sku text unique, -- SKU/Barcode - generation logic elsewhere
  item_details jsonb not null default '{}'::jsonb, -- name, description, images, condition, serial/batch tracking info
  pricing_info jsonb not null default '{}'::jsonb, -- cost price, selling price
  stock_levels jsonb not null default '{}'::jsonb, -- current quantity, min/max levels, reorder points, location
  supplier_ids uuid[] default '{}', -- Array of supplier UUIDs (if suppliers table exists)
  category_id uuid, -- References a categories table (if exists)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  metadata jsonb not null default '{}'::jsonb
);

comment on table inventory_items is 'Manages details of inventory items.';


-- 4. inventory_transactions table
create table if not exists inventory_transactions (
  id uuid primary key default uuid_generate_v4(),
  item_id uuid not null references inventory_items(id) on delete restrict,
  transaction_type text not null, -- e.g., 'stock_in', 'stock_out', 'adjustment', 'transfer', 'damage', 'return'
  quantity numeric not null check (quantity > 0),
  reference_type text, -- e.g., 'purchase', 'sale', 'rental'
  reference_id uuid, -- ID from the related table (purchases, sales, rental_agreements)
  performed_by uuid references auth.users(id),
  transaction_date timestamptz not null default now(),
  notes text,
  created_at timestamptz not null default now()
);

comment on table inventory_transactions is 'Logs all movements and changes in inventory stock.';


-- 5. properties table
create table if not exists properties (
  id uuid primary key default uuid_generate_v4(),
  property_code text unique, -- auto-generated logic
  property_details jsonb not null default '{}'::jsonb, -- type, address, size, amenities, photos, documents, value, tax info
  owner_member_id uuid references members(id) on delete set null, -- Link to a member
  current_tenant_id uuid, -- Link to a member or external tenant record (need a tenants table?)
  status text, -- e.g., 'available', 'occupied', 'under_maintenance'
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  metadata jsonb not null default '{}'::jsonb
);

comment on table properties is 'Manages details of community properties for rent.';


-- 6. rental_agreements table
create table if not exists rental_agreements (
  id uuid primary key default uuid_generate_v4(),
  property_id uuid not null references properties(id) on delete cascade,
  tenant_id uuid, -- Link to a member or external tenant record
  agreement_details jsonb not null default '{}'::jsonb, -- lease agreement upload info, terms
  start_date date not null,
  end_date date,
  monthly_rent numeric not null check (monthly_rent >= 0),
  deposit_amount numeric not null default 0 check (deposit_amount >= 0),
  status text not null default 'active', -- e.g., 'active', 'expired', 'terminated'
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  metadata jsonb not null default '{}'::jsonb
);

comment on table rental_agreements is 'Stores details of rental agreements for properties.';


-- 7. rent_payments table
create table if not exists rent_payments (
  id uuid primary key default uuid_generate_v4(),
  agreement_id uuid not null references rental_agreements(id) on delete restrict,
  payment_month date, -- e.g., 'YYYY-MM-01' for the month the rent is due
  amount_due numeric not null check (amount_due >= 0),
  amount_paid numeric not null default 0 check (amount_paid >= 0),
  payment_date timestamptz,
  payment_method text, -- e.g., 'cash', 'bank_transfer', 'upi', 'gateway'
  transaction_reference text, -- UPI ID, bank transaction ID, gateway charge ID
  status text not null default 'due', -- e.g., 'due', 'partial', 'paid', 'overdue', 'waived'
  receipt_number text unique, -- auto-generated logic
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  received_by uuid references auth.users(id), -- User who recorded the payment
  metadata jsonb not null default '{}'::jsonb
);

comment on table rent_payments is 'Records rent payment transactions.';


-- 8. purchases table
create table if not exists purchases (
  id uuid primary key default uuid_generate_v4(),
  purchase_number text unique, -- auto-generated logic
  supplier_id uuid, -- References a suppliers table (if exists)
  purchase_date date not null,
  items jsonb not null default '[]'::jsonb, -- JSONB array of purchased items (item_id, quantity, price, etc.)
  total_amount numeric not null check (total_amount >= 0),
  tax_amount numeric not null default 0 check (tax_amount >= 0),
  payment_status text not null default 'due', -- e.g., 'due', 'partial', 'paid', 'cancelled'
  payment_details jsonb not null default '{}'::jsonb, -- details of payment transactions for this purchase
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  metadata jsonb not null default '{}'::jsonb
);

comment on table purchases is 'Records inventory purchase transactions.';


-- 9. sales table
create table if not exists sales (
  id uuid primary key default uuid_generate_v4(),
  invoice_number text unique, -- auto-generated logic
  customer_id uuid references members(id) on delete set null, -- Link to a member or external customer record
  sale_date timestamptz not null default now(),
  items jsonb not null default '[]'::jsonb, -- JSONB array of sold items (item_id, quantity, price, discount, etc.)
  total_amount numeric not null check (total_amount >= 0),
  tax_amount numeric not null default 0 check (tax_amount >= 0),
  payment_details jsonb not null default '{}'::jsonb, -- details of payment transactions for this sale (can be multiple methods)
  status text not null default 'completed', -- e.g., 'completed', 'pending', 'cancelled', 'returned'
  sale_type text, -- e.g., 'pos', 'online', 'credit'
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  metadata jsonb not null default '{}'::jsonb
);

comment on table sales is 'Records inventory sales transactions.';


-- 10. membership_plans table
create table if not exists membership_plans (
  id uuid primary key default uuid_generate_v4(),
  plan_name text not null unique,
  plan_type text, -- e.g., 'individual', 'family'
  fee_amount numeric not null check (fee_amount >= 0),
  billing_cycle text not null, -- e.g., 'annual', 'monthly', 'quarterly', 'lifetime'
  benefits jsonb not null default '{}'::jsonb, -- JSONB object describing benefits
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  metadata jsonb not null default '{}'::jsonb
);

comment on table membership_plans is 'Defines different membership tiers and their fees/benefits.';


-- 11. membership_subscriptions table
create table if not exists membership_subscriptions (
  id uuid primary key default uuid_generate_v4(),
  member_id uuid not null references members(id) on delete cascade,
  plan_id uuid not null references membership_plans(id) on delete restrict,
 start_date date not null default current_date, -- Automatically set to current date if not provided
  end_date date, -- Null for lifetime plans, otherwise calculated based on cycle
  status text not null default 'active', -- e.g., 'active', 'expired', 'cancelled', 'grace_period'
  auto_renew boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  metadata jsonb not null default '{}'::jsonb,

  -- A member can only have one active subscription to a specific plan at a time?
  -- Unique constraint might need refinement based on business logic (e.g., can a member have multiple *different* plans?)
  unique (member_id, plan_id)
);

comment on table membership_subscriptions is 'Tracks active and past membership subscriptions for members.';


-- Function to search members by name or member code
CREATE OR REPLACE FUNCTION search_members(search_term text)
RETURNS SETOF members
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM members
  WHERE
    -- Search by member_code
    member_code ILIKE '%' || search_term || '%'
    OR
    -- Search by personal_info (assuming names are stored in personal_info JSONB)
    personal_info ->> 'full_name' ILIKE '%' || search_term || '%'
    OR
    personal_info ->> 'first_name' ILIKE '%' || search_term || '%'
    OR
    personal_info ->> 'last_name' ILIKE '%' || search_term || '%';
END;
$$;

comment on function search_members is 'Searches for members by name or member code.';


-- 12. fee_payments table
create table if not exists fee_payments (
  id uuid primary key default uuid_generate_v4(),
  subscription_id uuid not null references membership_subscriptions(id) on delete restrict,
  amount numeric not null check (amount >= 0),
  payment_date timestamptz not null default now(),
  payment_method text, -- e.g., 'cash', 'bank_transfer', 'upi', 'gateway'
  transaction_id text, -- Payment gateway transaction ID
  receipt_number text unique, -- auto-generated logic
  status text not null default 'completed', -- e.g., 'completed', 'pending', 'failed', 'refunded'
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  received_by uuid references auth.users(id), -- User who recorded the payment
  metadata jsonb not null default '{}'::jsonb
);

comment on table fee_payments is 'Records membership fee payment transactions.';


-- 13. audit_logs table
create table if not exists audit_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id), -- User who performed the action (can be null for system actions)
  action text not null, -- e.g., 'INSERT', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT'
  table_name text, -- Table affected by the action
  record_id uuid, -- ID of the record affected
  old_values jsonb, -- Old data before update/delete
  new_values jsonb, -- New data after insert/update
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now(),
  metadata jsonb default '{}'::jsonb -- additional context
);

comment on table audit_logs is 'Logs user and system actions for auditing purposes.';


-- Add Indexes for frequently queried columns
create index if not exists idx_members_is_active on members(is_active);
create index if not exists idx_members_is_deceased on members(is_deceased);
create index if not exists idx_relationships_member_1_id on relationships(member_1_id);
create index if not exists idx_relationships_member_2_id on relationships(member_2_id);
create index if not exists idx_inventory_items_category_id on inventory_items(category_id); -- if categories table is implemented
create index if not exists idx_inventory_items_sku on inventory_items(sku);
create index if not exists idx_inventory_transactions_item_id on inventory_transactions(item_id);
create index if not exists idx_inventory_transactions_transaction_type on inventory_transactions(transaction_type);
create index if not exists idx_properties_owner_member_id on properties(owner_member_id);
create index if not exists idx_rental_agreements_property_id on rental_agreements(property_id);
create index if not exists idx_rental_agreements_tenant_id on rental_agreements(tenant_id); -- if tenants table is implemented
create index if not exists idx_rent_payments_agreement_id on rent_payments(agreement_id);
create index if not exists idx_purchases_supplier_id on purchases(supplier_id); -- if suppliers table is implemented
create index if not exists idx_sales_customer_id on sales(customer_id);
create index if not exists idx_membership_subscriptions_member_id on membership_subscriptions(member_id);
create index if not exists idx_membership_subscriptions_plan_id on membership_subscriptions(plan_id);
create index if not exists idx_membership_subscriptions_status on membership_subscriptions(status);
create index if not exists idx_fee_payments_subscription_id on fee_payments(subscription_id);
create index if not exists idx_audit_logs_user_id on audit_logs(user_id);
create index if not exists idx_audit_logs_action on audit_logs(action);
create index if not exists idx_audit_logs_table_name_record_id on audit_logs(table_name, record_id);


-- Enable Row Level Security (RLS) - requires policies to be defined separately
alter table members enable row level security;
alter table relationships enable row level security;
alter table inventory_items enable row level security;
alter table inventory_transactions enable row level security;
alter table properties enable row level security;
alter table rental_agreements enable row level security;
alter table rent_payments enable row level security;
alter table purchases enable row level security;
alter table sales enable row level security;
alter table membership_plans enable row level security; -- likely read-only for most users
alter table membership_subscriptions enable row level security;
alter table fee_payments enable row level security;
alter table audit_logs enable row level security; -- likely append-only and read-only for admins

-- Add triggers for updated_at
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER members_updated_at
BEFORE UPDATE ON members
FOR EACH ROW
EXECUTE PROCEDURE update_timestamp();

CREATE TRIGGER inventory_items_updated_at
BEFORE UPDATE ON inventory_items
FOR EACH ROW
EXECUTE PROCEDURE update_timestamp();

CREATE TRIGGER properties_updated_at
BEFORE UPDATE ON properties
FOR EACH ROW
EXECUTE PROCEDURE update_timestamp();

CREATE TRIGGER rental_agreements_updated_at
BEFORE UPDATE ON rental_agreements
FOR EACH ROW
EXECUTE PROCEDURE update_timestamp();

CREATE TRIGGER rent_payments_updated_at
BEFORE UPDATE ON rent_payments
FOR EACH ROW
EXECUTE PROCEDURE update_timestamp();

CREATE TRIGGER purchases_updated_at
BEFORE UPDATE ON purchases
FOR EACH ROW
EXECUTE PROCEDURE update_timestamp();

CREATE TRIGGER sales_updated_at
BEFORE UPDATE ON sales
FOR EACH ROW
EXECUTE PROCEDURE update_timestamp();

CREATE TRIGGER membership_plans_updated_at
BEFORE UPDATE ON membership_plans
FOR EACH ROW
EXECUTE PROCEDURE update_timestamp();

CREATE TRIGGER membership_subscriptions_updated_at
BEFORE UPDATE ON membership_subscriptions
FOR EACH ROW
EXECUTE PROCEDURE update_timestamp();

CREATE TRIGGER fee_payments_updated_at
BEFORE UPDATE ON fee_payments
FOR EACH ROW
EXECUTE PROCEDURE update_timestamp();