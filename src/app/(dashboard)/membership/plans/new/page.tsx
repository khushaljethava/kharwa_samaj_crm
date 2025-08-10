"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewMembershipPlanPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    const plan_name = String(formData.get("plan_name") || "");
    const plan_type = String(formData.get("plan_type") || "");
    const fee_amount = Number(formData.get("fee_amount") || 0);
    const billing_cycle = String(formData.get("billing_cycle") || "");
    const body = {
      plan_name,
      plan_type,
      fee_amount,
      billing_cycle,
      benefits: {},
      is_active: true,
    };
    const res = await fetch("/api/membership/plans", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    setLoading(false);
    if (res.ok) router.push("/membership/plans");
    else {
      const j = await res.json().catch(() => ({}));
      setError(j?.error || "Failed to create plan");
    }
  }

  return (
    <div className="space-y-6 max-w-xl">
      <h1 className="text-xl font-semibold">New Membership Plan</h1>
      <form action={onSubmit} className="space-y-4">
        <input name="plan_name" placeholder="Plan name" className="w-full rounded border px-3 py-2" required />
        <input name="plan_type" placeholder="Type (e.g., Annual, Lifetime)" className="w-full rounded border px-3 py-2" required />
        <div className="grid grid-cols-2 gap-2">
          <input name="fee_amount" type="number" step="0.01" placeholder="Fee amount" className="w-full rounded border px-3 py-2" />
          <input name="billing_cycle" placeholder="Billing cycle (e.g., yearly)" className="w-full rounded border px-3 py-2" />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button disabled={loading} className="px-3 py-2 rounded bg-primary text-primary-foreground disabled:opacity-50 hover:opacity-90">
          {loading ? "Saving..." : "Save"}
        </button>
      </form>
    </div>
  );
}


