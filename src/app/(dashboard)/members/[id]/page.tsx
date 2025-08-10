import Link from "next/link";
import MemberPhotoUploader from "@/components/members/MemberPhotoUploader";
import { Fragment } from "react";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import DeleteButton from "@/components/ui/DeleteButton";

type MemberMetadata = {
  photo_url?: string;
  documents?: {
    aadhar_url?: string;
    pan_url?: string;
    others?: string[];
  };
};

type Member = {
  id: string;
  member_code: string | null;
  personal_info: Record<string, unknown> | null;
  contact_info: Record<string, unknown> | null;
  address_info: Record<string, unknown> | null;
  membership_info: Record<string, unknown> | null;
  metadata: MemberMetadata | null;
  is_active: boolean;
  is_deceased: boolean;
};

async function fetchMember(id: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("members")
    .select("id, member_code, personal_info, contact_info, address_info, membership_info, metadata")
    .eq("id", id)
    .single();
  if (error) return null;
  return data as Member;
}

export default async function MemberDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const member = await fetchMember(id);
  if (!member) return notFound();
  const pi = (member.personal_info || {}) as Record<string, unknown>;
  const meta = (member.metadata || {}) as MemberMetadata;
  const name = [pi.first_name as string, pi.middle_name as string, pi.last_name as string]
    .filter(Boolean)
    .join(" ") || "—";
  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{name}</h1>
        <div className="flex items-center gap-3">
          <Link href={`/members/${id}/tree`} className="text-sm underline">Open Family Tree</Link>
          <Link href="/members" className="text-sm underline">Back</Link>
          <DeleteButton endpoint={`/api/members/${id}`} label="Delete Member" />
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border p-4 bg-card">
          <h2 className="font-semibold mb-3">Member</h2>
          <MemberPhotoUploader memberId={id} currentUrl={(meta?.photo_url as string) || null} />
          <div className="text-sm mt-2"><span className="text-muted-foreground">Code:</span> {member.member_code}</div>
          <div className="mt-4">
            <h3 className="text-sm font-medium mb-2">Personal</h3>
          <dl className="text-xs grid grid-cols-2 gap-y-1">
            {Object.entries(member.personal_info || {}).map(([k, v]) => (
              <Fragment key={`p-${k}`}>
                <dt className="text-muted-foreground capitalize">{k.replaceAll("_"," ")}</dt>
                <dd className="break-words">{String(v ?? "—")}</dd>
              </Fragment>
            ))}
          </dl>
          </div>
        </div>
        <div className="rounded-xl border p-4 bg-card">
          <h2 className="font-semibold mb-3">Contact</h2>
          <dl className="text-xs grid grid-cols-2 gap-y-1">
            {Object.entries(member.contact_info || {}).map(([k, v]) => (
              <Fragment key={`c-${k}`}>
                <dt className="text-muted-foreground capitalize">{k.replaceAll("_"," ")}</dt>
                <dd className="break-words">{String(v ?? "—")}</dd>
              </Fragment>
            ))}
          </dl>
        </div>
        <div className="rounded-xl border p-4 bg-card">
          <h2 className="font-semibold mb-3">Address</h2>
          <dl className="text-xs grid grid-cols-2 gap-y-1">
            {Object.entries(member.address_info || {}).map(([k, v]) => (
              <Fragment key={`a-${k}`}>
                <dt className="text-muted-foreground capitalize">{k.replaceAll("_"," ")}</dt>
                <dd className="break-words">{String(v ?? "—")}</dd>
              </Fragment>
            ))}
          </dl>
        </div>
        <div className="rounded-xl border p-4 bg-card">
          <h2 className="font-semibold mb-3">Membership</h2>
          <dl className="text-xs grid grid-cols-2 gap-y-1">
            {Object.entries(member.membership_info || {}).map(([k, v]) => (
              <Fragment key={`m-${k}`}>
                <dt className="text-muted-foreground capitalize">{k.replaceAll("_"," ")}</dt>
                <dd className="break-words">{String(v ?? "—")}</dd>
              </Fragment>
            ))}
          </dl>
        </div>
        <div className="rounded-xl border p-4 md:col-span-2 bg-card">
          <h2 className="font-semibold mb-3">Documents</h2>
          {meta?.documents ? (
            <div className="text-sm space-y-2">
              {meta.documents.aadhar_url && (
                <div>
                  <span className="text-muted-foreground">Aadhar: </span>
                  <a className="underline text-primary" href={meta.documents.aadhar_url as string} target="_blank" rel="noreferrer">View</a>
                </div>
              )}
              {meta.documents.pan_url && (
                <div>
                  <span className="text-muted-foreground">PAN: </span>
                  <a className="underline text-primary" href={meta.documents.pan_url as string} target="_blank" rel="noreferrer">View</a>
                </div>
              )}
              {Array.isArray(meta.documents.others) && meta.documents.others.length > 0 && (
                <div>
                  <span className="text-muted-foreground">Others: </span>
                  <ul className="list-disc pl-5 space-y-1">
                    {(meta.documents.others as string[]).map((url, idx) => (
                      <li key={idx}><a className="underline text-primary" href={url} target="_blank" rel="noreferrer">Document {idx + 1}</a></li>
                    ))}
                  </ul>
                </div>
              )}
              {!meta.documents.aadhar_url && !meta.documents.pan_url && (!Array.isArray(meta.documents.others) || meta.documents.others.length === 0) && (
                <div className="text-muted-foreground">No documents</div>
              )}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">No documents</div>
          )}
        </div>
      </div>
      <FamilyTree memberId={id} />
    </div>
  );
}

async function FamilyTree({ memberId }: { memberId: string }) {
  const supabase = await createSupabaseServerClient();
  const { data: rels1 } = await supabase
    .from("relationships")
    .select("id, member_1_id, member_2_id, relationship_type, relationship_status")
    .eq("member_1_id", memberId)
    .limit(500);
  const { data: rels2 } = await supabase
    .from("relationships")
    .select("id, member_1_id, member_2_id, relationship_type, relationship_status")
    .eq("member_2_id", memberId)
    .limit(500);
  const allRels = [...(rels1 || []), ...(rels2 || [])];
  const otherIds = Array.from(
    new Set<string>(
      allRels.map((r: any) => (r.member_1_id === memberId ? r.member_2_id : r.member_1_id)),
    ),
  );
  const { data: relatedMembers } = await supabase
    .from("members")
    .select("id, member_code, personal_info")
    .in("id", otherIds);
  const idToMember = new Map<string, any>((relatedMembers || []).map((m: any) => [m.id, m]));
  const family: Record<string, Array<any>> = {
    parents: [],
    children: [],
    spouses: [],
    siblings: [],
    extended_family: [],
    in_law: [],
    guardian: [],
  };
  for (const r of allRels) {
    const isForward = r.member_1_id === memberId;
    const otherId = isForward ? r.member_2_id : r.member_1_id;
    const other = idToMember.get(otherId);
    if (!other) continue;
    const entry = { ...other, relationship_type: r.relationship_type, relationship_status: r.relationship_status };
    switch (r.relationship_type) {
      case "spousal":
        family.spouses.push(entry);
        break;
      case "sibling":
        family.siblings.push(entry);
        break;
      case "parent_child":
        if (isForward) family.children.push(entry);
        else family.parents.push(entry);
        break;
      case "extended_family":
        family.extended_family.push(entry);
        break;
      case "in_law":
        family.in_law.push(entry);
        break;
      case "guardian":
        if (isForward) family.children.push(entry);
        else family.parents.push(entry);
        family.guardian.push(entry);
        break;
      default:
        family.extended_family.push(entry);
    }
  }
  function renderList(key: string, list: Array<{ id: string; name: string }>) {
    if (!list || list.length === 0) return null;
    return (
      <div className="rounded border p-4">
        <h2 id="family" className="font-semibold mb-2">{key.replaceAll("_", " ")}</h2>
        <ul className="space-y-1 text-sm">
          {list.map((m) => {
            const pi = (m.personal_info || {}) as Record<string, unknown>;
            const name = [pi.first_name as string, pi.middle_name as string, pi.last_name as string]
              .filter(Boolean)
              .join(" ") || "—";
            return (
              <li key={m.id} className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{name}</div>
                  <div className="text-muted-foreground">{m.member_code || "—"}</div>
                </div>
                <Link className="underline" href={`/members/${m.id}`}>Open</Link>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }
  return (
    <div className="grid gap-4">
      <h2 className="text-xl font-semibold">Family</h2>
      {renderList("parents", family.parents || [])}
      {renderList("spouses", family.spouses || [])}
      {renderList("siblings", family.siblings || [])}
      {renderList("children", family.children || [])}
      {renderList("guardian", family.guardian || [])}
      {renderList("in_law", family.in_law || [])}
      {renderList("extended_family", family.extended_family || [])}
    </div>
  );
}

