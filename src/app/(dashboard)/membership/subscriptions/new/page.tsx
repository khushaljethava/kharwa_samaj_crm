"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Member {
  id: string;
  member_code: string;
  personal_info: any;
}

interface Plan {
  id: string;
  plan_name: string;
  plan_type: string;
  fee_amount: number;
  billing_cycle: string;
}

export default function NewMembershipSubscriptionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    fetchMembers();
    fetchPlans();
  }, []);

  async function fetchMembers() {
    try {
      const res = await fetch("/api/members");
      if (res.ok) {
        const data = await res.json();
        setMembers(data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch members:", err);
    }
  }

  async function fetchPlans() {
    try {
      const res = await fetch("/api/membership/plans");
      if (res.ok) {
        const data = await res.json();
        setPlans(data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch plans:", err);
    }
  }

  async function onSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    
    const member_id = String(formData.get("member_id") || "");
    const plan_id = String(formData.get("plan_id") || "");
    const start_date = String(formData.get("start_date") || "");
    const end_date = String(formData.get("end_date") || "") || null;
    const auto_renew = formData.get("auto_renew") === "on";
    
    if (!member_id || !plan_id) {
      setError("Please select both member and plan");
      setLoading(false);
      return;
    }
    
    const body = { member_id, plan_id, start_date, end_date, auto_renew };
    const res = await fetch("/api/membership/subscriptions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    
    setLoading(false);
    if (res.ok) {
      router.push("/membership/subscriptions");
    } else {
      const j = await res.json().catch(() => ({}));
      setError(j?.error || "Failed to create subscription");
    }
  }

  const filteredMembers = members.filter(member => {
    const name = member.personal_info?.full_name || 
                member.personal_info?.first_name + ' ' + member.personal_info?.last_name || 
                '';
    return name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           member.member_code?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-xl font-semibold">New Membership Subscription</h1>
      
      <form action={onSubmit} className="space-y-4">
        {/* Member Selection */}
        <div className="space-y-2">
          <label className="block text-sm font-medium">Select Member</label>
          <input
            type="text"
            placeholder="Search by member name or code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded border px-3 py-2 mb-2"
          />
          <select
            name="member_id"
            className="w-full rounded border px-3 py-2"
            required
          >
            <option value="">Select a member...</option>
            {filteredMembers.map((member) => {
              const name = member.personal_info?.full_name || 
                          member.personal_info?.first_name + ' ' + member.personal_info?.last_name || 
                          'Unknown';
              return (
                <option key={member.id} value={member.id}>
                  {name} ({member.member_code})
                </option>
              );
            })}
          </select>
        </div>

        {/* Plan Selection */}
        <div className="space-y-2">
          <label className="block text-sm font-medium">Select Plan</label>
          <select
            name="plan_id"
            className="w-full rounded border px-3 py-2"
            required
          >
            <option value="">Select a plan...</option>
            {plans.map((plan) => (
              <option key={plan.id} value={plan.id}>
                {plan.plan_name} - ₹{plan.fee_amount} ({plan.billing_cycle})
              </option>
            ))}
          </select>
        </div>

        {/* Date Selection */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Start Date</label>
            <input 
              name="start_date" 
              type="date" 
              defaultValue={today} 
              className="w-full rounded border px-3 py-2" 
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">End Date (Optional)</label>
            <input 
              name="end_date" 
              type="date" 
              className="w-full rounded border px-3 py-2" 
            />
            <p className="text-xs text-gray-500 mt-1">Leave empty for lifetime/ongoing subscriptions</p>
          </div>
        </div>

        {/* Auto Renew */}
        <div className="flex items-center space-x-2">
          <input 
            type="checkbox" 
            name="auto_renew" 
            id="auto_renew"
            className="rounded"
          />
          <label htmlFor="auto_renew" className="text-sm font-medium">
            Auto-renew subscription
          </label>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        
        <div className="flex gap-3">
          <button 
            disabled={loading} 
            className="px-4 py-2 rounded bg-primary text-primary-foreground disabled:opacity-50 hover:opacity-90"
          >
            {loading ? "Creating..." : "Create Subscription"}
          </button>
          <button 
            type="button"
            onClick={() => router.push("/membership/subscriptions")}
            className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
