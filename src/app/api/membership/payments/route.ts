import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { feePaymentCreateSchema } from "@/lib/validators/feePayment";
import { rateLimit } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const subscription_id = searchParams.get("subscription_id");
  const year = searchParams.get("year");
  
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("fee_payments")
    .select(`
      id, 
      subscription_id, 
      amount, 
      payment_date, 
      payment_method, 
      receipt_number, 
      status,
      transaction_id,
      membership_subscriptions!inner (
        id,
        start_date,
        end_date,
        status,
        members!inner (
          id,
          member_code,
          personal_info
        ),
        membership_plans!inner (
          plan_name,
          billing_cycle,
          fee_amount
        )
      )
    `)
    .order("payment_date", { ascending: false });

  if (id) query = query.eq("id", id);
  if (subscription_id) query = query.eq("subscription_id", subscription_id);
  if (year) {
    const startOfYear = `${year}-01-01`;
    const endOfYear = `${year}-12-31`;
    query = query.gte("payment_date", startOfYear).lte("payment_date", endOfYear);
  }

  const { data, error } = await query.limit(500);
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


