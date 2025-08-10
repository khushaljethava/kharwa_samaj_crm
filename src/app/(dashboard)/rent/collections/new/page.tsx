"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type RentSource = { id: string; name: string };

export default function NewRentPaymentPage() {
  const router = useRouter();
  const [sources, setSources] = useState<RentSource[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSources() {
      const res = await fetch("/api/rent/sources");
      const json = await res.json().catch(() => ({}));
      setSources((json?.data || []).filter((s: any) => s.is_active));
    }
    loadSources();
  }, []);

  async function onSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    const body = {
      payment_month: String(formData.get("payment_month") || ""),
      months_covered: Number(formData.get("months_covered") || 1),
      amount_due: Number(formData.get("amount_due") || 0),
      amount_paid: Number(formData.get("amount_paid") || 0),
      payment_method: String(formData.get("payment_method") || ""),
      transaction_reference: String(formData.get("transaction_reference") || ""),
      source_id: String(formData.get("source_id") || "") || null,
      status: String(formData.get("status") || "paid"),
    };
    const res = await fetch("/api/rent/payments", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    setLoading(false);
    if (res.ok) router.push("/rent/collections");
    else {
      const j = await res.json().catch(() => ({}));
      setError(j?.error ? JSON.stringify(j.error) : "Failed to create");
    }
  }

  return (
    <div className="space-y-6 max-w-xl">
      <h1 className="text-xl font-semibold">New Rent Payment</h1>
      <form action={onSubmit} className="space-y-4">
        {/* Agreement ID removed */}
        <div>
          <Label htmlFor="payment_month">Payment Month</Label>
          <Input name="payment_month" id="payment_month" type="month" required />
        </div>
        <div>
          <Label htmlFor="months_covered">Months Covered</Label>
          <Select onValueChange={(v) => {
            const el = document.querySelector<HTMLInputElement>('input[name="months_covered"]');
            if (el) el.value = v;
          }}>
            <SelectTrigger>
              <SelectValue placeholder="1" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 24 }).map((_, i) => (
                <SelectItem key={i + 1} value={String(i + 1)}>{i + 1}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <input type="hidden" name="months_covered" defaultValue="1" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="amount_due">Amount Due</Label>
            <Input name="amount_due" id="amount_due" type="number" min="0" step="0.01" required />
          </div>
          <div>
            <Label htmlFor="amount_paid">Amount Paid</Label>
            <Input name="amount_paid" id="amount_paid" type="number" min="0" step="0.01" required />
          </div>
        </div>
        <div>
          <Label htmlFor="source_id">Source</Label>
          <Select onValueChange={(v) => {
            const el = document.querySelector<HTMLInputElement>('input[name="source_id"]');
            if (el) el.value = v;
          }}>
            <SelectTrigger>
              <SelectValue placeholder="Select source" />
            </SelectTrigger>
            <SelectContent>
              {sources.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <input type="hidden" name="source_id" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="payment_method">Payment Method</Label>
            <Input name="payment_method" id="payment_method" placeholder="cash/bank/upi" />
          </div>
          <div>
            <Label htmlFor="transaction_reference">Transaction Reference</Label>
            <Input name="transaction_reference" id="transaction_reference" placeholder="Txn ID" />
          </div>
        </div>
        <div>
          <Label htmlFor="status">Status</Label>
          <Input name="status" id="status" defaultValue="paid" />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button disabled={loading}>
          {loading ? "Saving…" : "Save Payment"}
        </Button>
      </form>
    </div>
  );
}


