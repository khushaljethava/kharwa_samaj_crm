"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export default function NewExpensePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    const body = {
      expense_date: String(formData.get("expense_date") || ""),
      category: String(formData.get("category") || ""),
      description: String(formData.get("description") || ""),
      amount: Number(formData.get("amount") || 0),
      vendor: String(formData.get("vendor") || ""),
      payment_method: String(formData.get("payment_method") || ""),
      reference: String(formData.get("reference") || ""),
    };
    const res = await fetch("/api/expenses", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    setLoading(false);
    if (res.ok) router.push("/expenses");
    else {
      const j = await res.json().catch(() => ({}));
      setError(j?.error ? JSON.stringify(j.error) : "Failed to create");
    }
  }

  return (
    <div className="space-y-6 max-w-xl">
      <h1 className="text-xl font-semibold">New Expense</h1>
      <form action={onSubmit} className="space-y-4">
        <div>
          <Label htmlFor="expense_date">Date</Label>
          <Input id="expense_date" name="expense_date" type="date" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="category">Category</Label>
            <Input id="category" name="category" placeholder="utilities/maintenance/etc" />
          </div>
          <div>
            <Label htmlFor="vendor">Vendor</Label>
            <Input id="vendor" name="vendor" placeholder="Vendor" />
          </div>
        </div>
        <div>
          <Label htmlFor="description">Description</Label>
          <Input id="description" name="description" placeholder="Describe expense" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="amount">Amount</Label>
            <Input id="amount" name="amount" type="number" min="0" step="0.01" required />
          </div>
          <div>
            <Label htmlFor="payment_method">Payment Method</Label>
            <Input id="payment_method" name="payment_method" placeholder="cash/bank/upi" />
          </div>
          <div>
            <Label htmlFor="reference">Reference</Label>
            <Input id="reference" name="reference" placeholder="Txn ID" />
          </div>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button disabled={loading}>{loading ? "Saving…" : "Save"}</Button>
      </form>
    </div>
  );
}


