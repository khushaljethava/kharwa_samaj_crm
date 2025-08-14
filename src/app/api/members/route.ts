import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { memberUpsertSchema } from "@/lib/validators/member";
import { rateLimit } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { searchParams } = new URL(request.url);
  const limitParam = searchParams.get("limit");
  const limit = limitParam ? Math.min(Math.max(parseInt(limitParam, 10) || 0, 1), 500) : 100;

  const { data, error } = await supabase.from("members").select("*").order("member_code", { ascending: true }).limit(limit);
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
  const rl = await rateLimit(request, "api:members:post");
  if (!rl.success)
    return NextResponse.json({ error: "Too Many Requests" }, { status: 429 });
  const body = await request.json().catch(() => ({}));
  const parsed = memberUpsertSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const supabase = await createSupabaseServerClient();
  const { data: member, error } = await supabase
    .from("members")
    .insert({
      personal_info: parsed.data.personal_info,
      contact_info: parsed.data.contact_info,
      address_info: parsed.data.address_info,
      membership_info: parsed.data.membership_info,
      metadata: parsed.data.metadata,
      is_active: parsed.data.is_active,
      is_deceased: parsed.data.is_deceased,
    })
    .select("*")
    .single();
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  // Optionally create relationships that reference this new member as member_1
  try {
    const relationshipsToCreate = Array.isArray((body as any).relationships_to_create)
      ? (body as any).relationships_to_create
      : [];

    if (relationshipsToCreate.length > 0) {
      const rows = relationshipsToCreate
        .filter((r: any) => r && typeof r.member_2_id === "string" && typeof r.relationship_type === "string")
        .map((r: any) => ({
          member_1_id: member.id,
          member_2_id: r.member_2_id,
          relationship_type: r.relationship_type,
          relationship_status: r.relationship_status ?? null,
          start_date: r.start_date ?? null,
          end_date: r.end_date ?? null,
          metadata: r.metadata ?? {},
        }));
      if (rows.length > 0) {
        const { error: relError } = await supabase.from("relationships").insert(rows);
        if (relError) {
          // Non-fatal: return created member even if relationship inserts failed
          return NextResponse.json({ data: member, warning: relError.message }, { status: 201 });
        }
      }
    }
  } catch {
    // swallow optional relationship errors
  }

  return NextResponse.json({ data: member }, { status: 201 });
}
