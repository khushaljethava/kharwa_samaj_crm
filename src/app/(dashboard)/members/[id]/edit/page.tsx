"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import MemberPhotoUploader from "@/components/members/MemberPhotoUploader";
import MemberDocumentUploader from "@/components/members/MemberDocumentUploader";


type PersonalInfo = Record<string, unknown>;
type ContactInfo = Record<string, unknown>;
type AddressInfo = Record<string, unknown>;
type MembershipInfo = Record<string, unknown>;
type Metadata = {
  photo_url?: string;
  documents?: {
    aadhar_url?: string;
    pan_url?: string;
    others?: string[];
  };
} & Record<string, unknown>;

type MemberData = {
  id: string;
  member_code: string | null;
  personal_info: PersonalInfo | null;
  contact_info: ContactInfo | null;
  address_info: AddressInfo | null;
  membership_info: MembershipInfo | null;
  metadata: Metadata | null;
  is_active?: boolean;
  is_deceased?: boolean;
};

export default function EditMemberPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const memberId = params.id;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [member, setMember] = useState<MemberData | null>(null);

  // Simple local state for common fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [isActive, setIsActive] = useState("true");

  useEffect(() => {
    let ignore = false;
    async function load() {
      setLoading(true);
      const res = await fetch(`/api/members/${memberId}`, { cache: "no-store" });
      setLoading(false);
      if (!res.ok) {
        alert("Failed to load member");
        return;
      }
      const json = await res.json();
      const m: MemberData = json?.data;
      if (!m) return;
      if (ignore) return;
      setMember(m);
      const pi = m.personal_info || {};
      const ci = m.contact_info || {};
      const ai = m.address_info || {};
      setFirstName(String(pi.first_name || ""));
      setLastName(String(pi.last_name || ""));
      setPhone(String(ci.phone_primary || ""));
      setEmail(String(ci.email_primary || ""));
      setAddress(String(ai.current_address || ""));
      setIsActive(String(m.is_active !== false));
    }
    if (memberId) load();
    return () => {
      ignore = true;
    };
  }, [memberId]);

  async function save() {
    if (!member) return;
    setSaving(true);
    try {
      const body = {
        personal_info: { ...(member.personal_info || {}), first_name: firstName, last_name: lastName },
        contact_info: { ...(member.contact_info || {}), phone_primary: phone, email_primary: email },
        address_info: { ...(member.address_info || {}), current_address: address },
        membership_info: member.membership_info || {},
        metadata: member.metadata || {},
        is_active: isActive === "true",
        is_deceased: member.is_deceased ?? false,
      };
      const res = await fetch(`/api/members/${memberId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed to save");
      router.push(`/members/${memberId}`);
    } catch (e) {
      alert((e as Error)?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div>Loading…</div>;
  if (!member) return <div>Member not found</div>;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Edit Member</h1>
        <Link className="text-sm underline" href={`/members/${memberId}`}>Cancel</Link>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="first_name">First Name</Label>
            <Input id="first_name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="last_name">Last Name</Label>
            <Input id="last_name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="phone_primary">Primary Phone</Label>
            <Input id="phone_primary" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="email_primary">Primary Email</Label>
            <Input id="email_primary" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="current_address">Current Address</Label>
            <Input id="current_address" value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>
          <div>
            <Label>Status</Label>
            <Select value={isActive} onValueChange={(v) => setIsActive(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
      
      {/* Photo Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Photo</CardTitle>
        </CardHeader>
        <CardContent>
          <MemberPhotoUploader 
            memberId={memberId} 
            currentUrl={(member.metadata as Metadata)?.photo_url || null} 
          />
        </CardContent>
      </Card>

      {/* Document Upload Section */}
      <MemberDocumentUploader 
        memberId={memberId} 
        currentDocuments={(member.metadata as Metadata)?.documents || null} 
      />


      
      <div className="flex gap-3">
        <Button onClick={save} disabled={saving}>{saving ? "Saving..." : "Save Changes"}</Button>
        <Link className="px-3 py-2 rounded border text-sm" href={`/members/${memberId}`}>Discard</Link>
      </div>
    </div>
  );
}


