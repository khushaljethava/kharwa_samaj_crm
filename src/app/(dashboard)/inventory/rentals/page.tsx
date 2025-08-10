import Link from "next/link";
import DeleteButton from "@/components/ui/DeleteButton";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function fetchRentals() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("inventory_rentals")
    .select("id, member_id, total_amount, status, created_at")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export default async function InventoryRentalsPage() {
  const rows = await fetchRentals();
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Inventory Rentals</h1>
        <Link className="px-3 py-2 rounded bg-primary text-primary-foreground hover:opacity-90" href="/inventory/rentals/new">New Rental</Link>
      </div>
      <div className="overflow-x-auto rounded border">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-muted text-left">
              <th className="p-2">Invoice</th>
              <th className="p-2">Member</th>
              <th className="p-2">Total</th>
              <th className="p-2">Status</th>
              <th className="p-2">Date</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r: any) => (
              <tr key={r.id} className="border-t">
                <td className="p-2">{r.invoice_number || r.id.slice(0, 8)}</td>
                <td className="p-2">{r.member_id}</td>
                <td className="p-2">₹{Number(r.total_amount || 0).toLocaleString()}</td>
                <td className="p-2">
                  <span className={`px-2 py-0.5 rounded text-xs border ${r.status === 'returned' ? 'bg-success/10 border-success/30 text-success' : r.status === 'overdue' ? 'bg-error/10 border-error/30 text-error' : 'bg-info/10 border-info/30 text-info'}`}>
                    {r.status}
                  </span>
                </td>
                <td className="p-2">{new Date(r.created_at).toLocaleDateString()}</td>
                <td className="p-2">
                  <div className="flex gap-2">
                    <Link className="px-2 py-1 text-sm rounded border" href={`/inventory/rentals/${r.id}`}>View</Link>
                    <DeleteButton endpoint={`/api/rentals/${r.id}`} />
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


