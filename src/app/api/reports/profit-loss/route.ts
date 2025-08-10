import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// Detailed P&L with per-entry data for multiple categories
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const start = searchParams.get("start");
  const end = searchParams.get("end");
  const supabase = await createSupabaseServerClient();

  // Donations
  let dQuery = supabase.from("donations").select("id, donation_date, donor_name, member_id, payment_method, reference, amount, notes");
  if (start) dQuery = dQuery.gte("donation_date", start);
  if (end) dQuery = dQuery.lte("donation_date", end);
  const { data: donationRows, error: dErr } = await dQuery.limit(10000);
  if (dErr) return NextResponse.json({ error: dErr.message }, { status: 500 });
  const donationTotal = (donationRows || []).reduce((s: number, r: any) => s + Number(r.amount || 0), 0);

  // Rent payments
  let rQuery = supabase.from("rent_payments").select("id, payment_month, amount_due, amount_paid, payment_date, payment_method, transaction_reference, status, metadata");
  if (start) rQuery = rQuery.gte("payment_month", start);
  if (end) rQuery = rQuery.lte("payment_month", end);
  const { data: rentRows, error: rErr } = await rQuery.limit(10000);
  if (rErr) return NextResponse.json({ error: rErr.message }, { status: 500 });
  const rentTotal = (rentRows || []).reduce((s: number, r: any) => s + Number(r.amount_paid || 0), 0);

  // Membership fee payments
  let fQuery = supabase.from("fee_payments").select("id, payment_date, amount, payment_method, receipt_number, status, subscription_id");
  if (start) fQuery = fQuery.gte("payment_date", start);
  if (end) fQuery = fQuery.lte("payment_date", end);
  const { data: feeRows, error: fErr } = await fQuery.limit(10000);
  if (fErr) return NextResponse.json({ error: fErr.message }, { status: 500 });
  const feeTotal = (feeRows || []).reduce((s: number, r: any) => s + Number(r.amount || 0), 0);

  // Inventory rentals (as income proxy; total_amount)
  let iQuery = supabase.from("inventory_rentals").select("id, created_at, member_id, total_amount, deposit, status, invoice_number");
  if (start) iQuery = iQuery.gte("created_at", start);
  if (end) iQuery = iQuery.lte("created_at", end);
  const { data: invRows, error: iErr } = await iQuery.limit(10000);
  if (iErr) return NextResponse.json({ error: iErr.message }, { status: 500 });
  const invTotal = (invRows || []).reduce((s: number, r: any) => s + Number(r.total_amount || 0), 0);

  // Purchases as expenses
  let pQuery = supabase.from("purchases").select("id, purchase_date, total_amount, tax_amount, payment_status");
  if (start) pQuery = pQuery.gte("purchase_date", start);
  if (end) pQuery = pQuery.lte("purchase_date", end);
  const { data: purchaseRows, error: pErr } = await pQuery.limit(10000);
  if (pErr) return NextResponse.json({ error: pErr.message }, { status: 500 });
  const purchaseTotal = (purchaseRows || []).reduce((s: number, r: any) => s + Number(r.total_amount || 0), 0);

  // Company expenses (operational)
  let eQuery = supabase.from("company_expenses").select("id, expense_date, category, description, amount, vendor, payment_method");
  if (start) eQuery = eQuery.gte("expense_date", start);
  if (end) eQuery = eQuery.lte("expense_date", end);
  const { data: expenseRows, error: eErr } = await eQuery.limit(10000);
  if (eErr) return NextResponse.json({ error: eErr.message }, { status: 500 });
  const expenseTotal = (expenseRows || []).reduce((s: number, r: any) => s + Number(r.amount || 0), 0);

  const income = donationTotal + rentTotal + feeTotal + invTotal;
  const expenses = purchaseTotal + expenseTotal;
  const profit = income - expenses;

  return NextResponse.json({
    range: { start, end },
    donations: { total: donationTotal, rows: donationRows || [] },
    rent: { total: rentTotal, rows: rentRows || [] },
    membership_fees: { total: feeTotal, rows: feeRows || [] },
    inventory_rentals: { total: invTotal, rows: invRows || [] },
    expenses: { purchases: purchaseTotal, company_expenses: expenseTotal, rows: purchaseRows || [], company_rows: expenseRows || [] },
    totals: { income, expenses, profit },
  });
}


