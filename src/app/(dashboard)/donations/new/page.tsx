"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function NewDonationPage() {
  const router = useRouter();
  const [members, setMembers] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [memberId, setMemberId] = useState<string>("");

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/members?limit=100");
      const j = await res.json().catch(() => ({}));
      setMembers((j?.data || []).map((m: any) => ({ id: m.id, name: displayName(m.personal_info, m.member_code, m.id) })));
    }
    load();
  }, []);

  async function onSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    const body = {
      member_id: memberId || null,
      donor_name: String(formData.get("donor_name") || ""),
      amount: Number(formData.get("amount") || 0),
      donation_date: String(formData.get("donation_date") || ""),
      payment_method: String(formData.get("payment_method") || ""),
      reference: String(formData.get("reference") || ""),
      notes: String(formData.get("notes") || ""),
    };
    const res = await fetch("/api/donations", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    setLoading(false);
    if (res.ok) router.push("/donations");
    else {
      const j = await res.json().catch(() => ({}));
      setError(j?.error ? JSON.stringify(j.error) : "Failed to create");
    }
  }

  return (
    <div className="space-y-6 max-w-xl">
      <h1 className="text-xl font-semibold">New Donation</h1>
      <form action={onSubmit} className="space-y-4">
        <div>
          <Label>Member (optional)</Label>
          <Select value={memberId} onValueChange={(v) => setMemberId(v)}>
            <SelectTrigger>
              <SelectValue placeholder="Link to a member (optional)" />
            </SelectTrigger>
            <SelectContent>
              {members.map((m) => (
                <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="donor_name">Donor name (if no member)</Label>
          <Input id="donor_name" name="donor_name" placeholder="Optional when a member is selected" />
        </div>
        <div>
          <Label htmlFor="amount">Amount</Label>
          <Input id="amount" name="amount" type="number" step="0.01" min="0" required />
        </div>
        <div>
          <Label htmlFor="donation_date">Date</Label>
          <Input id="donation_date" name="donation_date" type="date" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="payment_method">Payment method</Label>
            <Input id="payment_method" name="payment_method" placeholder="cash/bank/upi" />
          </div>
          <div>
            <Label htmlFor="reference">Reference</Label>
            <Input id="reference" name="reference" placeholder="Txn ID" />
          </div>
        </div>
        <div>
          <Label htmlFor="notes">Notes</Label>
          <Input id="notes" name="notes" placeholder="Optional" />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button disabled={loading}>{loading ? "Saving…" : "Save"}</Button>
      </form>
    </div>
  );
}

function displayName(pi?: any, code?: string, id?: string) {
  const name = [pi?.first_name, pi?.middle_name, pi?.last_name].filter(Boolean).join(" ");
  return name || code || id || "—";
}


