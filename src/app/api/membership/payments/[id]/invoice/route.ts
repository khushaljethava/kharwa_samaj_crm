import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { generateMembershipInvoicePdf } from "@/lib/utils/membership-invoice-pdf";
import { format } from "date-fns";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const supabase = await createSupabaseServerClient();
    
    // Fetch payment details with related member and plan information
    const { data: payment, error } = await supabase
      .from("fee_payments")
      .select(`
        id,
        receipt_number,
        amount,
        payment_date,
        payment_method,
        transaction_id,
        membership_subscriptions!inner (
          id,
          start_date,
          end_date,
          members!inner (
            id,
            member_code,
            personal_info
          ),
          membership_plans!inner (
            plan_name,
            plan_type,
            billing_cycle
          )
        )
      `)
      .eq("id", id)
      .single();

    if (error || !payment) {
      return NextResponse.json({ error: error?.message || "Payment not found" }, { status: 404 });
    }

    // Extract nested data safely
    const subscription = payment.membership_subscriptions;
    const member = subscription.members;
    const plan = subscription.membership_plans;
    
    // Get member name from personal_info
    const personalInfo = member.personal_info as Record<string, string>;
    const memberName = [
      personalInfo?.first_name,
      personalInfo?.middle_name,
      personalInfo?.last_name
    ]
      .filter(Boolean)
      .join(" ") || `Member ${member.member_code}`;

    // Format payment date
    const paymentDate = format(new Date(payment.payment_date), "dd/MM/yyyy");

    // Prepare data for PDF generation
    const invoiceData = {
      receiptNumber: payment.receipt_number || `RCPT-${payment.id.substring(0, 8)}`,
      memberName: memberName,
      amount: Number(payment.amount),
      paymentDate: paymentDate,
      paymentMethod: payment.payment_method,
      planName: plan.plan_name,
      additionalDetails: `${plan.plan_type} - ${plan.billing_cycle}`
    };

    // Generate PDF using the new template-based generator
    const pdfBytes = await generateMembershipInvoicePdf(invoiceData);

    // Return PDF for inline viewing
    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="receipt-${payment.receipt_number}.pdf"`,
        "Cache-Control": "no-cache"
      },
    });
  } catch (error) {
    console.error("Error generating membership payment invoice:", error);
    return NextResponse.json(
      { error: "Failed to generate invoice" }, 
      { status: 500 }
    );
  }
}


