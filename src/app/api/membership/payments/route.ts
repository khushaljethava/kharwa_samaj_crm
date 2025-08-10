import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { feePaymentCreateSchema } from "@/lib/validators/feePayment";
import { rateLimit } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const supabase = await createSupabaseServerClient();
  let q = supabase
    .from("fee_payments")
    .select("id, subscription_id, amount, payment_date, payment_method, receipt_number, status")
    .order("payment_date", { ascending: false });
  if (id) q = q.eq("id", id);
  const { data, error } = await q.limit(100);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
  const rl = await rateLimit(request, "api:membership:payments:post");
  if (!rl.success)
    return NextResponse.json({ error: "Too Many Requests" }, { status: 429 });
  const json = await request.json().catch(() => ({}));
  const parsed = feePaymentCreateSchema.safeParse(json);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const supabase = await createSupabaseServerClient();
  // Generate a simple receipt number
  const receipt_number = `RCPT-${Date.now()}`;
  const { data, error } = await supabase
    .from("fee_payments")
    .insert({
      subscription_id: parsed.data.subscription_id,
      amount: parsed.data.amount,
      payment_date: parsed.data.payment_date || new Date().toISOString(),
      payment_method: parsed.data.payment_method,
      transaction_id: parsed.data.transaction_id,
      receipt_number,
      status: "paid",
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
  const { error } = await supabase.from("fee_payments").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}


