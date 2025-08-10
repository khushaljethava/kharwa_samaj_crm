import { NextResponse, type NextRequest } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const supabase = await createSupabaseServerClient();
  const { data: payment, error } = await supabase
    .from("fee_payments")
    .select("id, receipt_number, amount, payment_date, payment_method, subscription_id")
    .eq("id", id)
    .single();
  if (error || !payment)
    return NextResponse.json({ error: error?.message || "Not found" }, { status: 404 });

  const { data: sub } = await supabase
    .from("membership_subscriptions")
    .select("id, member_id, plan_id, start_date, end_date")
    .eq("id", payment.subscription_id)
    .single();
  const { data: member } = await supabase
    .from("members")
    .select("member_code, personal_info")
    .eq("id", sub?.member_id)
    .single();
  const { data: plan } = await supabase
    .from("membership_plans")
    .select("plan_name, plan_type")
    .eq("id", sub?.plan_id)
    .single();

  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595.28, 841.89]); // A4
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const draw = (text: string, x: number, y: number, size = 12) => {
    page.drawText(text, { x, y, size, font, color: rgb(0, 0, 0) });
  };

  // Header
  draw("SHREE MANDVI KHARVA SAMAJ", 180, 800, 16);
  draw(`Receipt No: ${payment.receipt_number}`, 40, 770);
  draw(`Date: ${new Date(payment.payment_date as unknown as string).toLocaleDateString()}`, 420, 770);

  // Body
  const pi = (member?.personal_info || {}) as Record<string, unknown>;
  const name = [pi.first_name as string, pi.middle_name as string, pi.last_name as string]
    .filter(Boolean)
    .join(" ") || "Member";
  draw(`Member: ${name} (${member?.member_code || "-"})`, 40, 740);
  draw(`Plan: ${plan?.plan_name || "-"} (${plan?.plan_type || "-"})`, 40, 720);
  draw(`Amount: ₹ ${Number(payment.amount).toFixed(2)}`, 40, 700);
  draw(`Method: ${payment.payment_method || "-"}`, 40, 680);

  // Footer signature area (blank)
  draw("Signature:", 40, 640);

  const bytes = await pdf.save();
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `inline; filename="receipt-${payment.receipt_number}.pdf"`,
    },
  });
}


