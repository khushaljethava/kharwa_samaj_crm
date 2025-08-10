-- Inventory rentals (renting inventory items to members)
create table if not exists inventory_rentals (
  id uuid primary key default uuid_generate_v4(),
  member_id uuid not null references members(id) on delete restrict,
  items jsonb not null default '[]'::jsonb, -- [{ item_id, quantity, unit_rate }]
  deposit numeric not null default 0 check (deposit >= 0),
  total_amount numeric not null default 0 check (total_amount >= 0),
  start_date date not null default current_date,
  due_date date,
  status text not null default 'active', -- active, returned, overdue, cancelled
  invoice_number text unique,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id)
);

comment on table inventory_rentals is 'Renting out inventory items to members.';

create index if not exists idx_inventory_rentals_member on inventory_rentals(member_id);
create index if not exists idx_inventory_rentals_status on inventory_rentals(status);

-- Reuse update_timestamp trigger function if exists
do $$ begin
  perform 1 from pg_proc where proname = 'update_timestamp';
  if not found then
    create or replace function update_timestamp()
    returns trigger as $fn$
    begin
      new.updated_at = now();
      return new;
    end;
    $fn$ language plpgsql;
  end if;
end $$;

create trigger inventory_rentals_updated_at
before update on inventory_rentals
for each row
execute procedure update_timestamp();


