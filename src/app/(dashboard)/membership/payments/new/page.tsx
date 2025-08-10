"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewMembershipPaymentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    const subscription_id = String(formData.get("subscription_id") || "");
    const amount = Number(formData.get("amount") || 0);
    const payment_date = String(formData.get("payment_date") || "");
    const payment_method = String(formData.get("payment_method") || "");
    const body = { subscription_id, amount, payment_date, payment_method };
    const res = await fetch("/api/membership/payments", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    setLoading(false);
    if (res.ok) router.push("/membership/payments");
    else {
      const j = await res.json().catch(() => ({}));
      setError(j?.error ? JSON.stringify(j.error) : "Failed to record payment");
    }
  }

  return (
    <div className="space-y-6 max-w-xl">
      <h1 className="text-xl font-semibold">New Membership Payment</h1>
      <form action={onSubmit} className="space-y-4">
        <input name="subscription_id" placeholder="Subscription ID" className="w-full rounded border px-3 py-2" required />
        <div className="grid grid-cols-2 gap-2">
          <input name="amount" type="number" step="0.01" placeholder="Amount" className="w-full rounded border px-3 py-2" required />
          <input name="payment_date" type="date" className="w-full rounded border px-3 py-2" />
        </div>
        <input name="payment_method" placeholder="Method (e.g., cash, UPI)" className="w-full rounded border px-3 py-2" />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button disabled={loading} className="px-3 py-2 rounded bg-primary text-primary-foreground disabled:opacity-50 hover:opacity-90">
          {loading ? "Saving..." : "Save"}
        </button>
      </form>
    </div>
  );
}


