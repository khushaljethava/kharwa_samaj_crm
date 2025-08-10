-- Company expenses (operational)
create table if not exists company_expenses (
  id uuid primary key default uuid_generate_v4(),
  expense_date date not null default current_date,
  category text, -- e.g., utilities, maintenance, salaries, misc
  description text,
  amount numeric not null check (amount >= 0),
  vendor text,
  payment_method text, -- cash/bank/upi/etc
  reference text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id)
);

comment on table company_expenses is 'Operational expenses for the organization.';

create index if not exists idx_company_expenses_date on company_expenses(expense_date);
create index if not exists idx_company_expenses_category on company_expenses(category);

alter table company_expenses enable row level security;

do $$ begin
  create policy company_expenses_select on company_expenses for select using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy company_expenses_write_admin on company_expenses for all
  using (auth_role() in ('app_manager','app_admin'))
  with check (auth_role() in ('app_manager','app_admin'));
exception when duplicate_object then null; end $$;


