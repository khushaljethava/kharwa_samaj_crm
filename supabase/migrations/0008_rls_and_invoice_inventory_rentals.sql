-- Enable RLS for new tables and add basic policies
alter table if exists rent_sources enable row level security;
alter table if exists inventory_rentals enable row level security;

-- Read for all; write restricted to manager/admin roles via auth_role() helper
do $$ begin
  create policy rent_sources_select on rent_sources for select using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy rent_sources_write_admin on rent_sources for all
  using (auth_role() in ('app_manager','app_admin'))
  with check (auth_role() in ('app_manager','app_admin'));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy inventory_rentals_select on inventory_rentals for select using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy inventory_rentals_write_admin on inventory_rentals for all
  using (auth_role() in ('app_manager','app_admin'))
  with check (auth_role() in ('app_manager','app_admin'));
exception when duplicate_object then null; end $$;

-- Helpful indexes
create index if not exists idx_inventory_rentals_created_at on inventory_rentals(created_at);
create index if not exists idx_inventory_rentals_due_date on inventory_rentals(due_date);

-- Auto-generate invoice_number if null on insert
create sequence if not exists inventory_rentals_invoice_seq;

create or replace function gen_inventory_rental_invoice() returns trigger as $$
begin
  if new.invoice_number is null or new.invoice_number = '' then
    new.invoice_number := 'IR-' || to_char(now(), 'YYYYMM') || '-' || lpad(nextval('inventory_rentals_invoice_seq')::text, 6, '0');
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_inventory_rentals_invoice on inventory_rentals;
create trigger trg_inventory_rentals_invoice
before insert on inventory_rentals
for each row execute procedure gen_inventory_rental_invoice();


