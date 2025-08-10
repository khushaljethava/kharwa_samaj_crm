create table if not exists categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  parent_id uuid references categories(id) on delete set null,
  created_at timestamptz not null default now()
);

create unique index if not exists idx_categories_name on categories(name);

create table if not exists suppliers (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  contact_info jsonb not null default '{}'::jsonb,
  address_info jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table inventory_items
  add column if not exists category_id uuid references categories(id) on delete set null;


