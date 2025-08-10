-- Helpful indexes for performance
create index if not exists idx_members_created_at on members(created_at desc);
create index if not exists idx_inventory_items_sku on inventory_items(sku);
create index if not exists idx_rent_payments_status on rent_payments(status);
create index if not exists idx_fee_payments_status on fee_payments(status);
create index if not exists idx_sales_date on sales(sale_date);
create index if not exists idx_purchases_date on purchases(purchase_date);


