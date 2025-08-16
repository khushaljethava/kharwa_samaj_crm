import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");

    const { data: payments, error } = await supabase
      .from("membership_fee_payments")
      .select(`
        id,
        member_id,
        amount,
        payment_date,
        payment_method,
        receipt_number,
        notes,
        members!inner (
          id,
          member_code,
          personal_info
        )
      `)
      .order("payment_date", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error fetching membership fee payments:", error);
      return NextResponse.json({ error: "Failed to fetch payments" }, { status: 500 });
    }

    return NextResponse.json({ payments });
  } catch (error) {
    console.error("Error in membership fees GET:", error);
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

    const body = await request.json();
    const { member_id, amount, payment_method, notes } = body;

    if (!member_id || !amount || amount <= 0 || !payment_method) {
      return NextResponse.json({ 
        error: "member_id, amount, and payment_method are required" 
      }, { status: 400 });
    }

    // Generate receipt number
    const receiptNumber = `MF-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

    // Start a transaction
    const { data: payment, error: paymentError } = await supabase
      .from("membership_fee_payments")
      .insert([
        {
          member_id,
          amount,
          payment_date: new Date().toISOString(),
          payment_method,
          receipt_number: receiptNumber,
          notes: notes || null,
          created_by: user.id,
        },
      ])
      .select()
      .single();

    if (paymentError) {
      console.error("Error creating membership fee payment:", paymentError);
      return NextResponse.json({ error: "Failed to create payment" }, { status: 500 });
    }

    // Update member status to active
    const { error: memberUpdateError } = await supabase
      .from("members")
      .update({ 
        is_active: true,
        membership_info: {
          last_payment_date: new Date().toISOString(),
          last_payment_amount: amount,
          last_payment_method: payment_method
        }
      })
      .eq("id", member_id);

    if (memberUpdateError) {
      console.error("Error updating member status:", memberUpdateError);
      // Payment was created but member status update failed
      // We should still return success for the payment
    }

    return NextResponse.json({ payment }, { status: 201 });
  } catch (error) {
    console.error("Error in membership fees POST:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
