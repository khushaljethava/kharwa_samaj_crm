import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import DeleteButton from "@/components/ui/DeleteButton";
import { Button } from "@/components/ui/button";
import { RentPdfDownloadButton } from "@/components/ui/RentPdfDownloadButton";

async function fetchCollections() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("rent_payments")
    .select("id, payment_month, amount_due, amount_paid, status, metadata")
    .order("payment_month", { ascending: false })
    .limit(50);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export default async function RentCollectionsPage() {
  const rows = await fetchCollections();
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Rent Collections</h1>
        <Link href="/rent/collections/new" className="px-3 py-2 rounded bg-primary text-primary-foreground hover:opacity-90">Add Rent Payment</Link>
      </div>
      <div className="overflow-x-auto rounded border">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-muted text-left">
              <th className="p-2">Month</th>
              <th className="p-2">Due</th>
              <th className="p-2">Paid</th>
              <th className="p-2">Status</th>
              <th className="p-2">Months Covered</th>
              <th className="p-2">Source</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(
              (
                r: {
                  id: string;
                  payment_month: string | Date;
                  amount_due: number;
                  amount_paid: number;
                  status: string;
                  metadata?: Record<string, any> | null;
                },
                idx: number,
              ) => (
                <tr key={idx} className="border-t">
                  <td className="p-2">
                    {new Date(r.payment_month).toISOString().slice(0, 7)}
                  </td>
                  <td className="p-2">{r.amount_due}</td>
                  <td className="p-2">{r.amount_paid}</td>
                  <td className="p-2">{r.status}</td>
                  <td className="p-2">{(r.metadata as any)?.months_covered || 1}</td>
                  <td className="p-2">{(r.metadata as any)?.source_id || "—"}</td>
                  <td className="p-2">
                    <div className="flex items-center gap-2">
                      <Link href={`/rent/collections/${r.id}/edit`}>
                        <Button variant="outline" size="sm">Edit</Button>
                      </Link>
                      <DeleteButton endpoint={`/api/rent/payments/${r.id}`} />
                      <RentPdfDownloadButton paymentId={r.id} />
                    </div>
                  </td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}


