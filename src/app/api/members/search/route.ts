import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") || "").trim();
  if (!q) return NextResponse.json({ data: [] });

  const supabase = await createSupabaseServerClient();

  // Prefer RPC if available; fallback to ILIKE filters if RPC not present
  const { data, error } = await supabase.rpc("search_members", { search_term: q });
  if (error) {
    // Fallback basic search
    const { data: fallbackData, error: fbError } = await supabase
      .from("members")
      .select("id, member_code, personal_info")
      .or(
        `member_code.ilike.%${q}%,personal_info->>first_name.ilike.%${q}%,personal_info->>last_name.ilike.%${q}%`,
      )
      .limit(20);
    if (fbError) return NextResponse.json({ error: fbError.message }, { status: 500 });
    return NextResponse.json({ data: fallbackData });
  }
  return NextResponse.json({ data });
}


