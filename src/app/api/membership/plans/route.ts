import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("membership_plans")
    .select("*")
    .order("plan_name", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
  const rl = await rateLimit(request, "api:membership:plans:post");
  if (!rl.success)
    return NextResponse.json({ error: "Too Many Requests" }, { status: 429 });
  const json = await request.json().catch(() => ({}));
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("membership_plans")
    .insert(json)
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}


