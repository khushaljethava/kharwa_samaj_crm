import { createSupabaseServerClient } from "@/lib/supabase/server";
import { generateRentInvoicePdf, RentInvoiceData } from "@/lib/utils/rent-invoice-pdf";
import { notFound } from "next/navigation";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createSupabaseServerClient();
    const { data: payment, error: paymentError } = await supabase
      .from("rent_payments")
      .select(
        `
        *,
        rental_agreements (
          tenant_id,
          members ( personal_info )
        )
      `,
      )
      .eq("id", id)
      .single();

    if (paymentError || !payment) {
      console.error("Error fetching rent payment:", paymentError);
      return notFound();
    }

    const sourceId = (payment.metadata as any)?.source_id;
    let sourceName = "N/A";
    if (sourceId) {
      const { data: source } = await supabase
        .from("rent_sources")
        .select("name")
        .eq("id", sourceId)
        .single();
      if (source) {
        sourceName = source.name;
      }
    }

    const personalInfo = (payment.rental_agreements as any)?.members?.personal_info;

    const invoiceData: RentInvoiceData = {
      receiptNumber: payment.id.slice(0, 8).toUpperCase(),
      tenantName: personalInfo?.full_name || `${personalInfo?.first_name || ""} ${personalInfo?.last_name || ""}`.trim() || "N/A",
      amount: payment.amount_paid,
      paymentDate: new Date(payment.created_at).toLocaleDateString(),
      rentMonth: new Date(payment.payment_month).toLocaleString("default", { month: "long", year: "numeric" }),
      sourceName: sourceName,
      paymentMethod: payment.payment_method,
      receiverName: payment.receiver_name,
    };

    const pdfBytes = await generateRentInvoicePdf(invoiceData);

    return new Response(pdfBytes, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="rent-receipt-${payment.id}.pdf"`,
      },
    });
  } catch (e) {
    console.error("Error generating PDF:", e);
    return new Response("Failed to generate PDF", { status: 500 });
  }
} 
