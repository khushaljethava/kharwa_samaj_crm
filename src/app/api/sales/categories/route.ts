import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface SalesCategory {
  id: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface CreateSalesCategoryRequest {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  is_active?: boolean;
}

export interface UpdateSalesCategoryRequest extends Partial<CreateSalesCategoryRequest> {
  id: string;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const is_active = searchParams.get("is_active");

    let query = supabase
      .from("sales_categories")
      .select("*")
      .order("name", { ascending: true });

    if (is_active !== null) {
      query = query.eq("is_active", is_active === "true");
    }

    const { data: categories, error } = await query;

    if (error) {
      console.error("Error fetching sales categories:", error);
      return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
    }

    return NextResponse.json({ categories });
  } catch (error) {
    console.error("Error in sales categories GET:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: CreateSalesCategoryRequest = await request.json();

    if (!body.name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    // Check if category with same name already exists
    const { data: existingCategory } = await supabase
      .from("sales_categories")
      .select("id")
      .eq("name", body.name)
      .single();

    if (existingCategory) {
      return NextResponse.json({ error: "Category with this name already exists" }, { status: 400 });
    }

    const { data: category, error } = await supabase
      .from("sales_categories")
      .insert([
        {
          name: body.name,
          description: body.description,
          color: body.color || "#3B82F6", // Default blue color
          icon: body.icon || "tag",
          is_active: body.is_active ?? true,
          created_by: user.id,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error creating sales category:", error);
      return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
    }

    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    console.error("Error in sales categories POST:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
