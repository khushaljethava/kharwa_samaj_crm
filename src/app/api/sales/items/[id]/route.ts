import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { UpdateSalesItemRequest } from "@/lib/types/sales";

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    const { data: item, error } = await supabase
      .from("sales_items")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching sales item:", error);
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    return NextResponse.json({ item });
  } catch (error) {
    console.error("Error in sales item GET:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const body: UpdateSalesItemRequest = await request.json();

    // No price validation needed since price is set per bill item

    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.is_active !== undefined) updateData.is_active = body.is_active;

    const { data: item, error } = await supabase
      .from("sales_items")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating sales item:", error);
      return NextResponse.json({ error: "Failed to update item" }, { status: 500 });
    }

    return NextResponse.json({ item });
  } catch (error) {
    console.error("Error in sales item PUT:", error);
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
      .from("sales_items")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting sales item:", error);
      return NextResponse.json({ error: "Failed to delete item" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in sales item DELETE:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
