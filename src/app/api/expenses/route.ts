import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";

const expenseSchema = z.object({
  expense_date: z.string().optional(),
  category: z.string().optional(),
  description: z.string().optional(),
  amount: z.number().min(0),
  vendor: z.string().optional(),
  payment_method: z.string().optional(),
  reference: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const start = searchParams.get("start");
  const end = searchParams.get("end");
  const id = searchParams.get("id");
  const supabase = await createSupabaseServerClient();
  let q = supabase.from("company_expenses").select("*").order("expense_date", { ascending: false });
  if (id) q = q.eq("id", id);
  if (start) q = q.gte("expense_date", start);
  if (end) q = q.lte("expense_date", end);
  const { data, error } = await q.limit(1000);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
  const rl = await rateLimit(request, "api:expenses:post");
  if (!rl.success) return NextResponse.json({ error: "Too Many Requests" }, { status: 429 });
  const json = await request.json().catch(() => ({}));
  const parsed = expenseSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("company_expenses")
    .insert({
      expense_date: parsed.data.expense_date || null,
      category: parsed.data.category || null,
      description: parsed.data.description || null,
      amount: parsed.data.amount,
      vendor: parsed.data.vendor || null,
      payment_method: parsed.data.payment_method || null,
      reference: parsed.data.reference || null,
    })
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("company_expenses").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}


