import Link from "next/link";
import DeleteButton from "@/components/ui/DeleteButton";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Suspense } from "react";
import { DateRangeFilter } from "./range";

async function fetchDonations(start?: string, end?: string) {
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("donations")
    .select("id, donor_name, member_id, amount, donation_date, payment_method")
    .order("donation_date", { ascending: false })
    .limit(200);
  if (start) query = query.gte("donation_date", start);
  if (end) query = query.lte("donation_date", end);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export default async function DonationsPage({ searchParams }: { searchParams?: Promise<{ start?: string; end?: string }> }) {
  const { start, end } = (await searchParams) || {};
  const rows = await fetchDonations(start, end);
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Donations</h1>
        <Link href="/donations/new" className="px-3 py-2 rounded bg-primary text-primary-foreground hover:opacity-90">Add Donation</Link>
      </div>
      <Suspense>
        <DateRangeFilter basePath="/donations" />
      </Suspense>
      <div className="overflow-x-auto rounded border">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-muted text-left">
              <th className="p-2">Date</th>
              <th className="p-2">Donor</th>
              <th className="p-2">Member</th>
              <th className="p-2">Method</th>
              <th className="p-2">Amount</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
              {rows.map((d: any) => (
              <tr key={d.id} className="border-t">
                <td className="p-2">{d.donation_date}</td>
                <td className="p-2">{d.donor_name || '—'}</td>
                <td className="p-2">{d.member_id || '—'}</td>
                <td className="p-2">{d.payment_method || '—'}</td>
                  <td className="p-2">{d.amount}</td>
                  <td className="p-2">
                    <div className="flex gap-2">
                      <Link className="px-2 py-1 text-sm rounded border" href={`/donations/new?edit=${d.id}`}>Edit</Link>
                      <DeleteButton endpoint={`/api/donations?id=${d.id}`} />
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


