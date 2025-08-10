import Link from "next/link";
import DeleteButton from "@/components/ui/DeleteButton";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function fetchPayments() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("fee_payments")
    .select("id, receipt_number, amount, payment_date, status")
    .order("payment_date", { ascending: false })
    .limit(50);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export default async function MembershipPaymentsPage() {
  const payments = await fetchPayments();
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Membership Payments</h1>
        <Link
          href="/membership/payments/new"
          className="px-3 py-2 rounded bg-primary text-primary-foreground hover:opacity-90"
        >
          Add Payment
        </Link>
      </div>
      <div className="overflow-x-auto rounded border">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-muted text-left">
              <th className="p-2">Receipt</th>
              <th className="p-2">Date</th>
              <th className="p-2">Amount</th>
              <th className="p-2">Status</th>
              <th className="p-2">Invoice</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p: { id: string; receipt_number: string; amount: number; payment_date: string; status: string; }) => (
              <tr key={p.id} className="border-t">
                <td className="p-2">{p.receipt_number}</td>
                <td className="p-2">{new Date(p.payment_date).toLocaleDateString()}</td>
                <td className="p-2">{p.amount}</td>
                <td className="p-2">{p.status}</td>
                <td className="p-2">
                  <a
                    className="underline"
                    href={`/api/membership/payments/${p.id}/invoice`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Download
                  </a>
                </td>
                <td className="p-2">
                  <div className="flex gap-2">
                    <Link className="px-2 py-1 text-sm rounded border" href={`/membership/payments/new?edit=${p.id}`}>Edit</Link>
                    <DeleteButton endpoint={`/api/membership/payments?id=${p.id}`} />
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


