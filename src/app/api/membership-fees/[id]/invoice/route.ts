import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { generateMembershipFeeInvoicePdf } from "@/lib/utils/membership-fee-invoice-pdf";
import { format } from "date-fns";

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    // Fetch the membership fee payment with member details
    const { data: payment, error } = await supabase
      .from("membership_fee_payments")
      .select(`
        *,
        members!inner (
          id,
          member_code,
          personal_info
        )
      `)
      .eq("id", id)
      .single();

    if (error || !payment) {
      console.error("Error fetching membership fee payment:", error);
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    // Format payment date
    const paymentDate = format(new Date(payment.payment_date), "dd/MM/yyyy");

    // Prepare data for PDF generation
    const pdfData = {
      receiptNumber: payment.receipt_number,
      memberName: getMemberDisplayName(payment.members),
      memberCode: payment.members.member_code,
      amount: Number(payment.amount),
      paymentMethod: payment.payment_method,
      paymentDate: paymentDate,
      notes: payment.notes,
    };

    // Generate PDF
    const pdfBytes = await generateMembershipFeeInvoicePdf(pdfData);

    // Return PDF as downloadable file
    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="membership-invoice-${payment.receipt_number}.pdf"`,
        "Cache-Control": "no-cache"
      },
    });
  } catch (error) {
    console.error("Error generating membership fee invoice PDF:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF" }, 
      { status: 500 }
    );
  }
}

function getMemberDisplayName(member: any): string {
  if (member.personal_info?.full_name) {
    return member.personal_info.full_name;
  }
  if (member.personal_info?.first_name || member.personal_info?.last_name) {
    return `${member.personal_info.first_name || ""} ${member.personal_info.last_name || ""}`.trim();
  }
  return member.member_code || member.id.slice(0, 8);
}
