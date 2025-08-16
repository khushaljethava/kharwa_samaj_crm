import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { UpdateSalesCategoryRequest } from "../route";

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    const { data: category, error } = await supabase
      .from("sales_categories")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching sales category:", error);
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    return NextResponse.json({ category });
  } catch (error) {
    console.error("Error in sales category GET:", error);
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
    const body: UpdateSalesCategoryRequest = await request.json();

    // Check if name is being updated and if it conflicts with existing category
    if (body.name) {
      const { data: existingCategory } = await supabase
        .from("sales_categories")
        .select("id")
        .eq("name", body.name)
        .neq("id", id)
        .single();

      if (existingCategory) {
        return NextResponse.json({ error: "Category with this name already exists" }, { status: 400 });
      }
    }

    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.color !== undefined) updateData.color = body.color;
    if (body.icon !== undefined) updateData.icon = body.icon;
    if (body.is_active !== undefined) updateData.is_active = body.is_active;

    const { data: category, error } = await supabase
      .from("sales_categories")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating sales category:", error);
      return NextResponse.json({ error: "Failed to update category" }, { status: 500 });
    }

    return NextResponse.json({ category });
  } catch (error) {
    console.error("Error in sales category PUT:", error);
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

    // Check if category is being used by any items
    const { data: itemsUsingCategory } = await supabase
      .from("sales_items")
      .select("id, name")
      .eq("category", id);

    if (itemsUsingCategory && itemsUsingCategory.length > 0) {
      return NextResponse.json({ 
        error: "Cannot delete category. It is being used by items: " + 
        itemsUsingCategory.map(item => item.name).join(", ") 
      }, { status: 400 });
    }

    const { error } = await supabase
      .from("sales_categories")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting sales category:", error);
      return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in sales category DELETE:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
