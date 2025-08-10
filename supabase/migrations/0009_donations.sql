-- Donations table
create table if not exists donations (
  id uuid primary key default uuid_generate_v4(),
  member_id uuid references members(id) on delete set null,
  donor_name text,
  amount numeric not null check (amount >= 0),
  donation_date date not null default current_date,
  payment_method text, -- cash/bank/upi/etc
  reference text,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id)
);

comment on table donations is 'Donation receipts (member-linked or external donor).';

create index if not exists idx_donations_date on donations(donation_date);
create index if not exists idx_donations_member on donations(member_id);

alter table donations enable row level security;

do $$ begin
  create policy donations_select on donations for select using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy donations_write_admin on donations for all
  using (auth_role() in ('app_manager','app_admin'))
  with check (auth_role() in ('app_manager','app_admin'));
exception when duplicate_object then null; end $$;


