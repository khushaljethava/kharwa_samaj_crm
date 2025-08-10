import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";

const paymentSchema = z.object({
  agreement_id: z.string().uuid().optional().nullable(),
  payment_month: z.string(),
  months_covered: z.number().int().min(1).max(24).default(1),
  amount_due: z.number().min(0),
  amount_paid: z.number().min(0),
  payment_date: z.string().optional(),
  payment_method: z.string().optional(),
  transaction_reference: z.string().optional(),
  source_id: z.string().uuid().optional().nullable(),
  status: z.string().optional().default("paid"),
});

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("rent_payments")
    .select("*, source_id:metadata->>source_id")
    .order("payment_month", { ascending: false })
    .limit(200);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
  const rl = await rateLimit(request, "api:rent:payments:post");
  if (!rl.success) return NextResponse.json({ error: "Too Many Requests" }, { status: 429 });
  const json = await request.json().catch(() => ({}));
  const parsed = paymentSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const supabase = await createSupabaseServerClient();
  // Store the source_id into metadata to avoid altering existing schema
  const insertBody = {
    ...(parsed.data.agreement_id ? { agreement_id: parsed.data.agreement_id } : {}),
    payment_month: parsed.data.payment_month,
    amount_due: parsed.data.amount_due,
    amount_paid: parsed.data.amount_paid,
    payment_date: parsed.data.payment_date || null,
    payment_method: parsed.data.payment_method || null,
    transaction_reference: parsed.data.transaction_reference || null,
    status: parsed.data.status,
    metadata: {
      ...(parsed.data.source_id ? { source_id: parsed.data.source_id } : {}),
      months_covered: parsed.data.months_covered,
    },
  } as const;
  const { data, error } = await supabase
    .from("rent_payments")
    .insert(insertBody)
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}


