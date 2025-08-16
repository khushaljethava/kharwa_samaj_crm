import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { generateSalesBillPdf } from "@/lib/utils/sales-invoice-pdf";
import { format } from "date-fns";

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    // Fetch the sales bill
    const { data: bill, error } = await supabase
      .from("sales_bills")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !bill) {
      console.error("Error fetching sales bill:", error);
      return NextResponse.json({ error: "Bill not found" }, { status: 404 });
    }

    // Format bill date
    const billDate = format(new Date(bill.created_at), "dd/MM/yyyy");

    // Prepare data for PDF generation
    const pdfData = {
      billNumber: bill.bill_number,
      customerName: bill.customer_name,
      customerPhone: bill.customer_phone,
      items: bill.items,
      subtotal: Number(bill.subtotal),
      membershipFee: Number(bill.membership_fee || 0),
      taxAmount: Number(bill.tax_amount),
      discountAmount: Number(bill.discount_amount),
      totalAmount: Number(bill.total_amount),
      paymentMethod: bill.payment_method,
      billDate: billDate,
      notes: bill.notes,
    };

    // Generate PDF
    const pdfBytes = await generateSalesBillPdf(pdfData);

    // Return PDF as downloadable file
    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="invoice-${bill.bill_number}.pdf"`,
        "Cache-Control": "no-cache"
      },
    });
  } catch (error) {
    console.error("Error generating sales bill PDF:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF" }, 
      { status: 500 }
    );
  }
}
