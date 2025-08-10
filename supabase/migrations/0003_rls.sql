-- Application roles
do $$ begin create role app_anonymous noinherit; exception when duplicate_object then null; end $$;
do $$ begin create role app_member noinherit; exception when duplicate_object then null; end $$;
do $$ begin create role app_manager noinherit; exception when duplicate_object then null; end $$;
do $$ begin create role app_admin noinherit; exception when duplicate_object then null; end $$;

-- Enable RLS
alter table members enable row level security;
alter table relationships enable row level security;
alter table inventory_items enable row level security;
alter table inventory_transactions enable row level security;
alter table properties enable row level security;
alter table rental_agreements enable row level security;
alter table rent_payments enable row level security;
alter table purchases enable row level security;
alter table sales enable row level security;
alter table membership_plans enable row level security;
alter table membership_subscriptions enable row level security;
alter table fee_payments enable row level security;
alter table audit_logs enable row level security;
alter table categories enable row level security;
alter table suppliers enable row level security;

-- Helper: extract role from JWT
create or replace function auth_role() returns text language sql stable as $$
  with claims as (
    select current_setting('request.jwt.claims', true)::jsonb as c
  )
  select coalesce(
    -- prefer top-level app_role if present
    (select c->>'app_role' from claims),
    -- fallback to app_metadata.app_role
    (select c->'app_metadata'->>'app_role' from claims),
    'app_member'
  )
$$;

-- Policies: members
create policy members_select on members
  for select using (true);
create policy members_insert_admin on members
  for insert with check (auth_role() in ('app_manager','app_admin'));
create policy members_update_admin on members
  for update using (auth_role() in ('app_manager','app_admin'));
create policy members_delete_admin on members
  for delete using (auth_role() in ('app_admin'));

-- Policies: relationships (read for all, write for admins)
create policy relationships_select on relationships
  for select using (true);
create policy relationships_write_admin on relationships
  for all using (auth_role() in ('app_manager','app_admin')) with check (auth_role() in ('app_manager','app_admin'));

-- Generic read for reference tables
create policy ref_read_categories on categories for select using (true);
create policy ref_read_suppliers on suppliers for select using (true);
create policy ref_read_plans on membership_plans for select using (true);

-- Admin write policies for most tables (simplified)
create policy admin_write_inventory_items on inventory_items for all using (auth_role() in ('app_manager','app_admin')) with check (auth_role() in ('app_manager','app_admin'));
create policy admin_write_properties on properties for all using (auth_role() in ('app_manager','app_admin')) with check (auth_role() in ('app_manager','app_admin'));
create policy admin_write_agreements on rental_agreements for all using (auth_role() in ('app_manager','app_admin')) with check (auth_role() in ('app_manager','app_admin'));
create policy admin_write_rent on rent_payments for all using (auth_role() in ('app_manager','app_admin')) with check (auth_role() in ('app_manager','app_admin'));
create policy admin_write_purchases on purchases for all using (auth_role() in ('app_manager','app_admin')) with check (auth_role() in ('app_manager','app_admin'));
create policy admin_write_sales on sales for all using (auth_role() in ('app_manager','app_admin')) with check (auth_role() in ('app_manager','app_admin'));
create policy admin_write_subscriptions on membership_subscriptions for all using (auth_role() in ('app_manager','app_admin')) with check (auth_role() in ('app_manager','app_admin'));
create policy admin_write_fee on fee_payments for all using (auth_role() in ('app_manager','app_admin')) with check (auth_role() in ('app_manager','app_admin'));


