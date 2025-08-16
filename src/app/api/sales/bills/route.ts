import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CreateSalesBillRequest, SalesBillFilters } from "@/lib/types/sales";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filters: SalesBillFilters = {
      customer_name: searchParams.get("customer_name") || undefined,
      bill_number: searchParams.get("bill_number") || undefined,
      payment_method: searchParams.get("payment_method") || undefined,
      from_date: searchParams.get("from_date") || undefined,
      to_date: searchParams.get("to_date") || undefined,
      limit: parseInt(searchParams.get("limit") || "50"),
      offset: parseInt(searchParams.get("offset") || "0"),
    };

    let query = supabase
      .from("sales_bills")
      .select("*")
      .order("created_at", { ascending: false });

    if (filters.customer_name) {
      query = query.ilike("customer_name", `%${filters.customer_name}%`);
    }

    if (filters.bill_number) {
      query = query.ilike("bill_number", `%${filters.bill_number}%`);
    }

    if (filters.payment_method) {
      query = query.eq("payment_method", filters.payment_method);
    }

    if (filters.from_date) {
      query = query.gte("created_at", filters.from_date);
    }

    if (filters.to_date) {
      query = query.lte("created_at", filters.to_date);
    }

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    if (filters.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
    }

    const { data: bills, error } = await query;

    if (error) {
      console.error("Error fetching sales bills:", error);
      return NextResponse.json({ error: "Failed to fetch bills" }, { status: 500 });
    }

    return NextResponse.json({ bills });
  } catch (error) {
    console.error("Error in sales bills GET:", error);
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

    const body: CreateSalesBillRequest = await request.json();

    if (!body.items || body.items.length === 0) {
      return NextResponse.json({ error: "At least one item is required" }, { status: 400 });
    }

    if (body.total_amount <= 0) {
      return NextResponse.json({ error: "Total amount must be greater than 0" }, { status: 400 });
    }

    const { data: bill, error } = await supabase
      .from("sales_bills")
      .insert([
        {
          customer_name: body.customer_name,
          customer_phone: body.customer_phone,
          items: body.items,
          subtotal: body.subtotal,
          membership_fee: body.membership_fee || 0,
          tax_amount: body.tax_amount || 0,
          discount_amount: body.discount_amount || 0,
          total_amount: body.total_amount,
          payment_method: body.payment_method,
          notes: body.notes,
          created_by: user.id,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error creating sales bill:", error);
      return NextResponse.json({ error: "Failed to create bill" }, { status: 500 });
    }

    return NextResponse.json({ bill }, { status: 201 });
  } catch (error) {
    console.error("Error in sales bills POST:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
