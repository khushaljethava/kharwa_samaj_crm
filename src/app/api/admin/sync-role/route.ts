import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST() {
  const supabase = await createSupabaseServerClient();
  const { data: userRes, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userRes.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const email = userRes.user.email?.toLowerCase();
  const allowedCsv = process.env.APP_ALLOWED_ADMINS || "";
  const allowed = allowedCsv
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  const targetRole = allowed.includes(email || "") ? "app_admin" : "app_member";

  const admin = createSupabaseAdminClient();
  const { error } = await admin.auth.admin.updateUserById(userRes.user.id, {
    app_metadata: { app_role: targetRole },
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, role: targetRole });
}


