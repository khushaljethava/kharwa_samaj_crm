import Link from "next/link";
import DeleteButton from "@/components/ui/DeleteButton";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import MembersSearch from "./search";

async function fetchMembers(status?: string, limit = 50) {
  const supabase = await createSupabaseServerClient();
  let q = supabase
    .from("members")
    .select("id, member_code, personal_info, contact_info, metadata, created_at, is_active")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (status === "active") q = q.eq("is_active", true);
  if (status === "inactive") q = q.eq("is_active", false);
  const { data, error } = await q;
  if (error) {
    if (error.message?.includes("Could not find the table")) return [] as any[];
    throw new Error(error.message);
  }
  return data ?? [];
}

async function fetchCounts() {
  const supabase = await createSupabaseServerClient();
  const [{ count: total }, { count: active }] = await Promise.all([
    supabase.from("members").select("id", { count: "exact", head: true }),
    supabase.from("members").select("id", { count: "exact", head: true }).eq("is_active", true),
  ]);
  return { total: total ?? 0, active: active ?? 0 };
}

export default async function MembersPage({ searchParams }: { searchParams?: Promise<{ status?: string; limit?: string }> }) {
  const { status, limit } = (await searchParams) || {};
  const effectiveLimit = Math.min(Math.max(parseInt(String(limit || 50), 10) || 50, 10), 500);
  const [members, counts] = await Promise.all([
    fetchMembers(status, effectiveLimit),
    fetchCounts(),
  ]);
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Members</h1>
          <p className="text-sm text-muted-foreground">Total: {counts.total.toLocaleString()} • Active: {counts.active.toLocaleString()}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/members?status=all" className={`px-2 py-1 rounded border ${!status || status === "all" ? "bg-muted" : ""}`}>All</Link>
          <Link href="/members?status=active" className={`px-2 py-1 rounded border ${status === "active" ? "bg-success/10 border-success/30" : ""}`}>Active</Link>
          <Link href="/members?status=inactive" className={`px-2 py-1 rounded border ${status === "inactive" ? "bg-warning/10 border-warning/30" : ""}`}>Inactive</Link>
          <Link
            href="/members/new"
            className="px-3 py-2 rounded bg-primary text-primary-foreground hover:opacity-90"
          >
            Add Member
          </Link>
        </div>
      </div>
      <MembersSearch />
      <div className="overflow-x-auto rounded border">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-muted text-left">
              <th className="p-2">Photo</th>
              <th className="p-2">Code</th>
              <th className="p-2">Name</th>
              <th className="p-2">Phone</th>
              <th className="p-2">Status</th>
              <th className="p-2">Joined</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {members.map(
              (m: {
                id: string;
                member_code: string;
                personal_info: Record<string, unknown> | null;
                contact_info?: Record<string, unknown> | null;
                metadata?: Record<string, unknown> | null;
                created_at?: string;
                is_active?: boolean;
              }) => {
                const pi = (m.personal_info || {}) as Record<string, unknown>;
                const name =
                  [
                    pi.first_name as string,
                    pi.middle_name as string,
                    pi.last_name as string,
                  ]
                    .filter(Boolean)
                    .join(" ") || "—";
                const phone = String((m.contact_info || ({} as any)).phone_primary || "—");
                const joined = m.created_at ? new Date(m.created_at).toLocaleDateString() : "—";
                const photo = String((m.metadata || ({} as any)).photo_url || "");
                return (
                  <tr key={m.id} className="border-t">
                    <td className="p-2 align-top">
                      {photo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={photo} alt="" className="h-8 w-8 rounded object-cover border" />
                      ) : (
                        <div className="h-8 w-8 rounded bg-muted grid place-items-center text-[10px] text-muted-foreground border">
                          {name && name !== "—" ? name.split(" ").map(p => p[0]).join("").slice(0,2).toUpperCase() : "—"}
                        </div>
                      )}
                    </td>
                    <td className="p-2 align-top">{m.member_code}</td>
                    <td className="p-2 align-top">
                      <Link className="underline" href={`/members/${m.id}`}>
                        {name}
                      </Link>
                    </td>
                    <td className="p-2 align-top">{phone}</td>
                    <td className="p-2 align-top">
                      <span className={`px-2 py-0.5 rounded text-xs border ${m.is_active !== false ? "bg-success/10 border-success/30 text-success" : "bg-warning/10 border-warning/30 text-warning"}`}>
                        {m.is_active !== false ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="p-2 align-top">{joined}</td>
                    <td className="p-2 align-top">
                      <div className="flex gap-2">
                        <Link className="px-2 py-1 text-sm rounded border" href={`/members/${m.id}/edit`}>Edit</Link>
                        <DeleteButton endpoint={`/api/members/${m.id}`} />
                      </div>
                    </td>
                  </tr>
                );
              },
            )}
            {members.length === 0 && (
              <tr>
                <td className="p-3" colSpan={7}>
                  No members
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="flex justify-end">
        <Link href={`/members?status=${encodeURIComponent(status || "all")}&limit=${effectiveLimit + 50}`} className="text-sm underline">Load more</Link>
      </div>
    </div>
  );
}
