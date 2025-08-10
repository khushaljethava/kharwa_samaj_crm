import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function fetchSources() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("rent_sources")
    .select("*")
    .order("name");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export default async function RentSourcesPage() {
  const rows = await fetchSources();
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Rent Sources</h1>
        <Link href="/rent/sources/new" className="px-3 py-2 rounded bg-primary text-primary-foreground hover:opacity-90">Add Source</Link>
      </div>
      <div className="overflow-x-auto rounded border">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-muted text-left">
              <th className="p-2">Name</th>
              <th className="p-2">Active</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s: { id: string; name: string; is_active: boolean }) => (
              <tr key={s.id} className="border-t">
                <td className="p-2">{s.name}</td>
                <td className="p-2">{s.is_active ? "Yes" : "No"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


