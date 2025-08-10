import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";

const donationSchema = z.object({
  member_id: z.string().uuid().optional().nullable(),
  donor_name: z.string().optional(),
  amount: z.number().min(0),
  donation_date: z.string().optional(),
  payment_method: z.string().optional(),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const start = searchParams.get("start");
  const end = searchParams.get("end");
  const id = searchParams.get("id");
  const supabase = await createSupabaseServerClient();
  let query = supabase.from("donations").select("*").order("donation_date", { ascending: false });
  if (id) query = query.eq("id", id);
  if (start) query = query.gte("donation_date", start);
  if (end) query = query.lte("donation_date", end);
  const { data, error } = await query.limit(500);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
  const rl = await rateLimit(request, "api:donations:post");
  if (!rl.success) return NextResponse.json({ error: "Too Many Requests" }, { status: 429 });
  const json = await request.json().catch(() => ({}));
  const parsed = donationSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("donations")
    .insert({
      member_id: parsed.data.member_id ?? null,
      donor_name: parsed.data.donor_name || null,
      amount: parsed.data.amount,
      donation_date: parsed.data.donation_date || null,
      payment_method: parsed.data.payment_method || null,
      reference: parsed.data.reference || null,
      notes: parsed.data.notes || null,
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
  const { error } = await supabase.from("donations").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}


