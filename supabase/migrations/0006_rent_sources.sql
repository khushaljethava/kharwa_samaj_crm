-- Rent sources allow categorizing where rent payments are received from
create table if not exists rent_sources (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id)
);

comment on table rent_sources is 'Sources for rent payments (e.g., cash counter A, bank account X, UPI ID).';

create index if not exists idx_rent_sources_active on rent_sources(is_active);


