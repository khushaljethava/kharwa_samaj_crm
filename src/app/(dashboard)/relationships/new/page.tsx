"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type MemberLite = { id: string; name: string };

const REL_TYPES = [
  { value: "parent_child", label: "Parent-Child" },
  { value: "spousal", label: "Spousal" },
  { value: "sibling", label: "Sibling" },
  { value: "extended_family", label: "Extended Family" },
  { value: "in_law", label: "In-law" },
  { value: "guardian", label: "Guardian" },
];

export default function NewRelationshipPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [members, setMembers] = useState<MemberLite[]>([]);
  const [member1, setMember1] = useState("");
  const [member2, setMember2] = useState("");
  const [relType, setRelType] = useState("spousal");
  const [relStatus, setRelStatus] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/members?limit=200");
      const j = await res.json().catch(() => ({}));
      setMembers((j?.data || []).map((m: any) => ({
        id: m.id,
        name: displayName(m.personal_info, m.member_code, m.id),
      })));
    }
    load();
  }, []);

  async function onSubmit() {
    setLoading(true);
    setError(null);
    const body = {
      member_1_id: member1,
      member_2_id: member2,
      relationship_type: relType,
      relationship_status: relStatus || undefined,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
    };
    const res = await fetch("/api/relationships", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    setLoading(false);
    if (res.ok) router.push("/relationships");
    else {
      const j = await res.json().catch(() => ({}));
      setError(j?.error ? JSON.stringify(j.error) : "Failed to create");
    }
  }

  return (
    <div className="space-y-6 max-w-xl">
      <h1 className="text-xl font-semibold">New Relationship</h1>
      <div className="space-y-4">
        <div>
          <Label>Member 1</Label>
          <Select value={member1} onValueChange={setMember1}>
            <SelectTrigger>
              <SelectValue placeholder="Select member" />
            </SelectTrigger>
            <SelectContent>
              {members.map((m) => (
                <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Member 2</Label>
          <Select value={member2} onValueChange={setMember2}>
            <SelectTrigger>
              <SelectValue placeholder="Select member" />
            </SelectTrigger>
            <SelectContent>
              {members.map((m) => (
                <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Relationship Type</Label>
          <Select value={relType} onValueChange={setRelType}>
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {REL_TYPES.map((r) => (
                <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Status (optional)</Label>
          <Input value={relStatus} onChange={(e) => setRelStatus(e.target.value)} placeholder="Status (optional)" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label>Start date</Label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div>
            <Label>End date</Label>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button disabled={loading || !member1 || !member2 || !relType} onClick={onSubmit}>
          {loading ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );
}

function displayName(pi?: any, code?: string, id?: string) {
  const name = [pi?.first_name, pi?.middle_name, pi?.last_name].filter(Boolean).join(" ");
  return name || code || id || "—";
}


