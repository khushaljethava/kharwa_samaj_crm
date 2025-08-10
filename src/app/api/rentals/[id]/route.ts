import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const itemSchema = z.object({ item_id: z.string().uuid(), quantity: z.number().min(1), unit_rate: z.number().min(0) });
const rentalSchema = z.object({
  items: z.array(itemSchema).min(1),
  deposit: z.number().min(0).default(0),
  total_amount: z.number().min(0),
  start_date: z.string().optional(),
  due_date: z.string().optional(),
  notes: z.string().optional(),
  status: z.string().optional(),
});

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("inventory_rentals")
    .select("*")
    .eq("id", id)
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json({ data });
}

export async function PUT(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const json = await request.json().catch(() => ({}));
  const parsed = rentalSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("inventory_rentals")
    .update({
      items: parsed.data.items,
      deposit: parsed.data.deposit,
      total_amount: parsed.data.total_amount,
      start_date: parsed.data.start_date || null,
      due_date: parsed.data.due_date || null,
      notes: parsed.data.notes || null,
      status: parsed.data.status || undefined,
    })
    .eq("id", id)
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

// Mark returned endpoint: restock items and set status="returned"
export async function PATCH(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const supabase = await createSupabaseServerClient();
  // Fetch rental
  const { data: rental, error: rErr } = await supabase
    .from("inventory_rentals")
    .select("id, items, status")
    .eq("id", id)
    .single();
  if (rErr) return NextResponse.json({ error: rErr.message }, { status: 404 });
  if (!rental) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const items = Array.isArray((rental as any).items) ? ((rental as any).items as Array<{ item_id: string; quantity: number }>) : [];
  for (const line of items) {
    // Log transaction
    await supabase.from("inventory_transactions").insert({
      item_id: line.item_id,
      transaction_type: "return",
      quantity: line.quantity,
      reference_type: "rental",
      reference_id: rental.id,
      notes: "Returned from rental",
    });
    // Increment stock level
    const { data: itemRow } = await supabase
      .from("inventory_items")
      .select("id, stock_levels")
      .eq("id", line.item_id)
      .single();
    const current = Number((itemRow as any)?.stock_levels?.current ?? 0);
    const next = current + Number(line.quantity || 0);
    await supabase
      .from("inventory_items")
      .update({ stock_levels: { ...(itemRow as any)?.stock_levels, current: next } })
      .eq("id", line.item_id);
  }

  const { data, error } = await supabase
    .from("inventory_rentals")
    .update({ status: "returned" })
    .eq("id", id)
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("inventory_rentals").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}


