import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";

const itemSchema = z.object({ item_id: z.string().uuid(), quantity: z.number().min(1), unit_rate: z.number().min(0) });
const rentalSchema = z.object({
  member_id: z.string().uuid(),
  items: z.array(itemSchema).min(1),
  deposit: z.number().min(0).default(0),
  total_amount: z.number().min(0),
  start_date: z.string().optional(),
  due_date: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("inventory_rentals")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
  const rl = await rateLimit(request, "api:rentals:post");
  if (!rl.success) return NextResponse.json({ error: "Too Many Requests" }, { status: 429 });
  const json = await request.json().catch(() => ({}));
  const parsed = rentalSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const supabase = await createSupabaseServerClient();
  // Validate stock availability upfront
  const requestedItems = Array.isArray(parsed.data.items) ? parsed.data.items : [];
  const itemIds = requestedItems.map((i) => i.item_id);
  if (itemIds.length === 0) return NextResponse.json({ error: "No items" }, { status: 400 });
  const { data: itemsRows, error: itemsErr } = await supabase
    .from("inventory_items")
    .select("id, stock_levels, sku, item_details")
    .in("id", itemIds);
  if (itemsErr) return NextResponse.json({ error: itemsErr.message }, { status: 500 });
  const idToItem = new Map((itemsRows || []).map((r: any) => [r.id, r]));
  const insufficient: Array<{ item_id: string; available: number; requested: number }> = [];
  for (const req of requestedItems) {
    const row: any = idToItem.get(req.item_id);
    const available = Number(row?.stock_levels?.current ?? 0);
    if (available < Number(req.quantity || 0)) {
      insufficient.push({ item_id: req.item_id, available, requested: Number(req.quantity || 0) });
    }
  }
  if (insufficient.length > 0) {
    return NextResponse.json({
      error: {
        message: "Insufficient stock for one or more items",
        details: insufficient,
      },
    }, { status: 400 });
  }
  const body = {
    member_id: parsed.data.member_id,
    items: parsed.data.items,
    deposit: parsed.data.deposit,
    total_amount: parsed.data.total_amount,
    start_date: parsed.data.start_date || null,
    due_date: parsed.data.due_date || null,
    notes: parsed.data.notes || null,
  };
  // Create rental
  const { data: rental, error } = await supabase
    .from("inventory_rentals")
    .insert(body)
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Log inventory transactions (stock_out) and update stock levels for each item
  for (const line of requestedItems) {
    // 1) Log transaction
    await supabase.from("inventory_transactions").insert({
      item_id: line.item_id,
      transaction_type: "stock_out",
      quantity: line.quantity,
      reference_type: "rental",
      reference_id: rental.id,
      notes: `Rented at rate ${line.unit_rate}`,
    });
    // 2) Decrement stock_levels.current
    const itemRow: any = idToItem.get(line.item_id);
    const current = Number(itemRow?.stock_levels?.current ?? 0);
    const next = Math.max(0, current - Number(line.quantity || 0));
    await supabase
      .from("inventory_items")
      .update({ stock_levels: { ...itemRow?.stock_levels, current: next } })
      .eq("id", line.item_id);
  }

  return NextResponse.json({ data: rental }, { status: 201 });
}


