import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function fetchRelationships() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("relationships")
    .select("*")
    .limit(100);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export default async function RelationshipsPage() {
  const relationships = await fetchRelationships();
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Relationships</h1>
        <Link href="/relationships/new" className="px-3 py-2 rounded bg-primary text-primary-foreground hover:opacity-90">Add Relationship</Link>
      </div>
      <div className="overflow-x-auto rounded border">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-muted text-left">
              <th className="p-2">Member 1</th>
              <th className="p-2">Type</th>
              <th className="p-2">Member 2</th>
            </tr>
          </thead>
          <tbody>
            {relationships.map(
              (r: {
                id: string;
                member_1_id: string;
                member_2_id: string;
                relationship_type: string;
              }) => (
                <tr key={r.id} className="border-t">
                  <td className="p-2">{r.member_1_id}</td>
                  <td className="p-2">{r.relationship_type}</td>
                  <td className="p-2">{r.member_2_id}</td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
