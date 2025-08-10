-- Enable extensions
create extension if not exists pgcrypto;
create extension if not exists "uuid-ossp";

-- Enums
do $$ begin
  create type relationship_type as enum (
    'parent', 'child', 'spouse', 'sibling', 'grandparent', 'grandchild',
    'uncle_aunt', 'cousin', 'in_law', 'guardian', 'other'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type transaction_type as enum ('stock_in','stock_out','transfer','adjustment','damage','return');
exception when duplicate_object then null; end $$;

do $$ begin
  create type subscription_status as enum ('active','inactive','suspended','cancelled','expired');
exception when duplicate_object then null; end $$;

-- Tables
create table if not exists members (
  id uuid primary key default uuid_generate_v4(),
  member_code text unique,
  personal_info jsonb not null default '{}'::jsonb,
  contact_info jsonb not null default '{}'::jsonb,
  address_info jsonb not null default '{}'::jsonb,
  membership_info jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  updated_by uuid,
  is_active boolean not null default true,
  is_deceased boolean not null default false,
  metadata jsonb not null default '{}'::jsonb
);

create or replace function set_updated_at()
returns trigger as $$ begin new.updated_at = now(); return new; end; $$ language plpgsql;

create trigger members_set_updated_at before update on members
for each row execute function set_updated_at();

create unique index if not exists idx_members_member_code on members(member_code);
create index if not exists idx_members_active on members(is_active);

create table if not exists relationships (
  id uuid primary key default uuid_generate_v4(),
  member_1_id uuid not null references members(id) on delete cascade,
  member_2_id uuid not null references members(id) on delete cascade,
  relationship_type relationship_type not null,
  relationship_status text,
  start_date date,
  end_date date,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create unique index if not exists idx_rel_unique on relationships(member_1_id, member_2_id, relationship_type);
create index if not exists idx_rel_member1 on relationships(member_1_id);
create index if not exists idx_rel_member2 on relationships(member_2_id);

create table if not exists inventory_items (
  id uuid primary key default uuid_generate_v4(),
  sku text unique not null,
  item_details jsonb not null default '{}'::jsonb,
  pricing_info jsonb not null default '{}'::jsonb,
  stock_levels jsonb not null default '{}'::jsonb,
  supplier_ids uuid[] default array[]::uuid[],
  category_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger inventory_items_set_updated_at before update on inventory_items
for each row execute function set_updated_at();

create table if not exists inventory_transactions (
  id uuid primary key default uuid_generate_v4(),
  item_id uuid not null references inventory_items(id) on delete cascade,
  transaction_type transaction_type not null,
  quantity numeric not null check (quantity >= 0),
  reference_type text,
  reference_id uuid,
  performed_by uuid,
  transaction_date timestamptz not null default now(),
  notes text
);
create index if not exists idx_inv_tx_item on inventory_transactions(item_id);
create index if not exists idx_inv_tx_date on inventory_transactions(transaction_date);

create table if not exists properties (
  id uuid primary key default uuid_generate_v4(),
  property_code text unique,
  property_details jsonb not null default '{}'::jsonb,
  owner_member_id uuid references members(id),
  current_tenant_id uuid references members(id),
  status text,
  created_at timestamptz not null default now()
);

create table if not exists rental_agreements (
  id uuid primary key default uuid_generate_v4(),
  property_id uuid not null references properties(id) on delete cascade,
  tenant_id uuid references members(id),
  agreement_details jsonb not null default '{}'::jsonb,
  start_date date not null,
  end_date date,
  monthly_rent numeric not null default 0,
  deposit_amount numeric not null default 0,
  status text not null default 'active',
  created_at timestamptz not null default now()
);
create index if not exists idx_rental_agreements_property on rental_agreements(property_id);

create table if not exists rent_payments (
  id uuid primary key default uuid_generate_v4(),
  agreement_id uuid not null references rental_agreements(id) on delete cascade,
  payment_month date not null,
  amount_due numeric not null default 0,
  amount_paid numeric not null default 0,
  payment_date timestamptz,
  payment_method text,
  transaction_reference text,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);
create unique index if not exists idx_rent_unique on rent_payments(agreement_id, payment_month);

create table if not exists purchases (
  id uuid primary key default uuid_generate_v4(),
  purchase_number text unique,
  supplier_id uuid,
  purchase_date date not null default (now())::date,
  items jsonb not null default '[]'::jsonb,
  total_amount numeric not null default 0,
  tax_amount numeric not null default 0,
  payment_status text not null default 'unpaid',
  payment_details jsonb not null default '{}'::jsonb
);

create table if not exists sales (
  id uuid primary key default uuid_generate_v4(),
  invoice_number text unique,
  customer_id uuid,
  sale_date date not null default (now())::date,
  items jsonb not null default '[]'::jsonb,
  total_amount numeric not null default 0,
  tax_amount numeric not null default 0,
  payment_details jsonb not null default '{}'::jsonb,
  status text not null default 'unpaid'
);

create table if not exists membership_plans (
  id uuid primary key default uuid_generate_v4(),
  plan_name text not null,
  plan_type text not null,
  fee_amount numeric not null default 0,
  billing_cycle text,
  benefits jsonb not null default '{}'::jsonb,
  is_active boolean not null default true
);

create table if not exists membership_subscriptions (
  id uuid primary key default uuid_generate_v4(),
  member_id uuid not null references members(id) on delete cascade,
  plan_id uuid not null references membership_plans(id) on delete restrict,
  start_date date not null,
  end_date date,
  status subscription_status not null default 'active',
  auto_renew boolean not null default false
);
create index if not exists idx_sub_member on membership_subscriptions(member_id);
create index if not exists idx_sub_plan on membership_subscriptions(plan_id);

create table if not exists fee_payments (
  id uuid primary key default uuid_generate_v4(),
  subscription_id uuid not null references membership_subscriptions(id) on delete cascade,
  amount numeric not null default 0,
  payment_date timestamptz,
  payment_method text,
  transaction_id text,
  receipt_number text unique,
  status text not null default 'pending'
);
create index if not exists idx_fee_pay_sub on fee_payments(subscription_id);

create table if not exists audit_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid,
  action text not null,
  table_name text not null,
  record_id uuid,
  old_values jsonb,
  new_values jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now()
);

-- Simple member_code generator
create or replace function ensure_member_code()
returns trigger as $$
begin
  if new.member_code is null then
    new.member_code := 'MBR-' || to_char(extract(epoch from now())::bigint, 'FM9999999990');
  end if;
  return new;
end; $$ language plpgsql;

create trigger members_set_code before insert on members
for each row execute function ensure_member_code();
