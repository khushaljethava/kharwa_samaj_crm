import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// Persist settings in a single-row table using metadata on a dedicated row
// Fallback: store in members table metadata for org_id = 'settings' if table not present

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("app_settings").select("id, data").limit(1).maybeSingle();
  if (error?.message?.includes("relation") || error?.message?.includes("not exist")) {
    return NextResponse.json({ data: null });
  }
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: (data as any)?.data || null });
}

export async function PUT(request: NextRequest) {
  const json = await request.json().catch(() => ({}));
  const supabase = await createSupabaseServerClient();
  // Upsert settings row
  const { error } = await supabase.from("app_settings").upsert({ id: "default", data: json }, { onConflict: "id" });
  if (error?.message?.includes("relation") || error?.message?.includes("not exist")) {
    // Try to create table dynamically (best-effort)
    await supabase.rpc("sql", { sql: `
      create table if not exists app_settings (
        id text primary key,
        data jsonb not null default '{}'::jsonb,
        updated_at timestamptz not null default now()
      );
    ` }).catch(() => {});
    const { error: upErr } = await supabase.from("app_settings").upsert({ id: "default", data: json }, { onConflict: "id" });
    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}


