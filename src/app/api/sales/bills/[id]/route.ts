import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    const { data: bill, error } = await supabase
      .from("sales_bills")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching sales bill:", error);
      return NextResponse.json({ error: "Bill not found" }, { status: 404 });
    }

    return NextResponse.json({ bill });
  } catch (error) {
    console.error("Error in sales bill GET:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    const { error } = await supabase
      .from("sales_bills")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting sales bill:", error);
      return NextResponse.json({ error: "Failed to delete bill" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in sales bill DELETE:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
