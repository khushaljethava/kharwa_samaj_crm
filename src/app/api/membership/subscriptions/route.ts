import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const member_id = searchParams.get("member_id");
  const status = searchParams.get("status") || "active";
  
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("membership_subscriptions")
    .select(`
      id,
      member_id,
      start_date,
      end_date,
      status,
      auto_renew,
      members!inner (
        id,
        member_code,
        personal_info
      ),
      membership_plans!inner (
        id,
        plan_name,
        plan_type,
        fee_amount,
        billing_cycle
      )
    `)
    .order("start_date", { ascending: false });

  if (member_id) {
    query = query.eq("member_id", member_id);
  }
  
  if (status !== "all") {
    query = query.eq("status", status);
  }

  const { data, error } = await query.limit(500);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
  const rl = await rateLimit(request, "api:membership:subscriptions:post");
  if (!rl.success)
    return NextResponse.json({ error: "Too Many Requests" }, { status: 429 });

  const json = await request.json().catch(() => ({}));
  const { member_id, plan_id, start_date, end_date, auto_renew } = json;

  if (!member_id || !plan_id) {
    return NextResponse.json({ error: "member_id and plan_id are required" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  
  // Check if member already has an active subscription to this plan
  const { data: existingSubscription } = await supabase
    .from("membership_subscriptions")
    .select("id")
    .eq("member_id", member_id)
    .eq("plan_id", plan_id)
    .eq("status", "active")
    .single();

  if (existingSubscription) {
    return NextResponse.json({ error: "Member already has an active subscription to this plan" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("membership_subscriptions")
    .insert({
      member_id,
      plan_id,
      start_date: start_date || new Date().toISOString().split('T')[0],
      end_date,
      auto_renew: auto_renew || false,
      status: "active"
    })
    .select(`
      id,
      member_id,
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
        fee_amount,
        billing_cycle
      )
    `)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("membership_subscriptions")
    .delete()
    .eq("id", id);
    
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
