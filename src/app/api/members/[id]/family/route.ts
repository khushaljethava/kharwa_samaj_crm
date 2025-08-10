import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type FamilyBuckets = {
  parents: Array<any>;
  children: Array<any>;
  spouses: Array<any>;
  siblings: Array<any>;
  extended_family: Array<any>;
  in_law: Array<any>;
  guardian: Array<any>;
};

export async function GET(
  _request: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const supabase = await createSupabaseServerClient();

  const { data: member, error: mErr } = await supabase
    .from("members")
    .select("id, member_code, personal_info, contact_info, address_info, membership_info")
    .eq("id", id)
    .single();
  if (mErr) return NextResponse.json({ error: mErr.message }, { status: 404 });

  const { data: rels1, error: e1 } = await supabase
    .from("relationships")
    .select("id, member_1_id, member_2_id, relationship_type, relationship_status, start_date, end_date, metadata")
    .eq("member_1_id", id)
    .limit(500);
  const { data: rels2, error: e2 } = await supabase
    .from("relationships")
    .select("id, member_1_id, member_2_id, relationship_type, relationship_status, start_date, end_date, metadata")
    .eq("member_2_id", id)
    .limit(500);
  if (e1 || e2)
    return NextResponse.json({ error: (e1 || e2)!.message }, { status: 500 });

  const allRels = [...(rels1 || []), ...(rels2 || [])];
  const otherIds = new Set<string>();

  const buckets: FamilyBuckets = {
    parents: [],
    children: [],
    spouses: [],
    siblings: [],
    extended_family: [],
    in_law: [],
    guardian: [],
  };

  for (const r of allRels) {
    const isForward = r.member_1_id === id;
    const otherId = isForward ? r.member_2_id : r.member_1_id;
    otherIds.add(otherId);
  }

  const { data: relatedMembers, error: rmErr } = await supabase
    .from("members")
    .select("id, member_code, personal_info")
    .in("id", Array.from(otherIds));
  if (rmErr) return NextResponse.json({ error: rmErr.message }, { status: 500 });

  const idToMember = new Map<string, any>(
    (relatedMembers || []).map((m) => [m.id, m]),
  );

  for (const r of allRels) {
    const isForward = r.member_1_id === id;
    const otherId = isForward ? r.member_2_id : r.member_1_id;
    const other = idToMember.get(otherId);
    if (!other) continue;
    const entry = { ...other, relationship_type: r.relationship_type, relationship_status: r.relationship_status };
    switch (r.relationship_type) {
      case "spousal":
        buckets.spouses.push(entry);
        break;
      case "sibling":
        buckets.siblings.push(entry);
        break;
      case "parent_child":
        if (isForward) buckets.children.push(entry);
        else buckets.parents.push(entry);
        break;
      case "extended_family":
        buckets.extended_family.push(entry);
        break;
      case "in_law":
        buckets.in_law.push(entry);
        break;
      case "guardian":
        if (isForward) buckets.children.push(entry);
        else buckets.parents.push(entry);
        buckets.guardian.push(entry);
        break;
      default:
        buckets.extended_family.push(entry);
    }
  }

  return NextResponse.json({ member, family: buckets });
}


