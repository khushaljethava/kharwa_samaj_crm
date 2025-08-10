import Link from "next/link";
import DeleteButton from "@/components/ui/DeleteButton";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Suspense } from "react";
import { DateRangeFilter } from "./range";

async function fetchExpenses(start?: string, end?: string) {
  const supabase = await createSupabaseServerClient();
  let q = supabase
    .from("company_expenses")
    .select("id, expense_date, category, description, amount, vendor, payment_method")
    .order("expense_date", { ascending: false })
    .limit(500);
  if (start) q = q.gte("expense_date", start);
  if (end) q = q.lte("expense_date", end);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export default async function ExpensesPage({ searchParams }: { searchParams?: Promise<{ start?: string; end?: string }> }) {
  const { start, end } = (await searchParams) || {};
  const rows = await fetchExpenses(start, end);
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Expenses</h1>
        <Link href="/expenses/new" className="px-3 py-2 rounded bg-primary text-primary-foreground hover:opacity-90">Add Expense</Link>
      </div>
      <Suspense>
        <DateRangeFilter basePath="/expenses" />
      </Suspense>
      <div className="overflow-x-auto rounded border">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-muted text-left">
              <th className="p-2">Date</th>
              <th className="p-2">Category</th>
              <th className="p-2">Description</th>
              <th className="p-2">Vendor</th>
              <th className="p-2">Method</th>
              <th className="p-2">Amount</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r: any) => (
              <tr key={r.id} className="border-t">
                <td className="p-2">{r.expense_date}</td>
                <td className="p-2">{r.category || '—'}</td>
                <td className="p-2">{r.description || '—'}</td>
                <td className="p-2">{r.vendor || '—'}</td>
                <td className="p-2">{r.payment_method || '—'}</td>
                <td className="p-2">{r.amount}</td>
                <td className="p-2">
                  <div className="flex gap-2">
                    <Link className="px-2 py-1 text-sm rounded border" href={`/expenses/new?edit=${r.id}`}>Edit</Link>
                    <DeleteButton endpoint={`/api/expenses?id=${r.id}`} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


