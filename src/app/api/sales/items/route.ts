import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CreateSalesItemRequest, SalesItemFilters } from "@/lib/types/sales";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filters: SalesItemFilters = {
      name: searchParams.get("name") || undefined,
      category: searchParams.get("category") || undefined,
      is_active: searchParams.get("is_active") === "true" ? true : searchParams.get("is_active") === "false" ? false : undefined,
      limit: parseInt(searchParams.get("limit") || "50"),
      offset: parseInt(searchParams.get("offset") || "0"),
    };

    let query = supabase
      .from("sales_items")
      .select("*")
      .order("name", { ascending: true });

    if (filters.name) {
      query = query.ilike("name", `%${filters.name}%`);
    }

    if (filters.category) {
      query = query.eq("category", filters.category);
    }

    if (filters.is_active !== undefined) {
      query = query.eq("is_active", filters.is_active);
    }

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    if (filters.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
    }

    const { data: items, error } = await query;

    if (error) {
      console.error("Error fetching sales items:", error);
      return NextResponse.json({ error: "Failed to fetch items" }, { status: 500 });
    }

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Error in sales items GET:", error);
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

    const body: CreateSalesItemRequest = await request.json();

    if (!body.name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const { data: item, error } = await supabase
      .from("sales_items")
      .insert([
        {
          name: body.name,
          description: body.description,
          category: body.category,
          is_active: body.is_active ?? true,
          created_by: user.id,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error creating sales item:", error);
      return NextResponse.json({ error: "Failed to create item" }, { status: 500 });
    }

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    console.error("Error in sales items POST:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
