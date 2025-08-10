import { createSupabaseServerClient } from "@/lib/supabase/server";

async function fetchPlans() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("membership_plans")
    .select("plan_name, plan_type, fee_amount, is_active")
    .order("plan_name", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export default async function MembershipPlansPage() {
  const plans = await fetchPlans();
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Membership Plans</h1>
        <a
          href="/membership/plans/new"
          className="px-3 py-2 rounded bg-primary text-primary-foreground hover:opacity-90"
        >
          Add Plan
        </a>
      </div>
      <div className="overflow-x-auto rounded border">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-muted text-left">
              <th className="p-2">Plan</th>
              <th className="p-2">Type</th>
              <th className="p-2">Fee</th>
              <th className="p-2">Active</th>
            </tr>
          </thead>
          <tbody>
            {plans.map(
              (
                p: {
                  plan_name: string;
                  plan_type: string;
                  fee_amount: number;
                  is_active: boolean;
                },
                idx: number,
              ) => (
                <tr key={idx} className="border-t">
                  <td className="p-2">{p.plan_name}</td>
                  <td className="p-2">{p.plan_type}</td>
                  <td className="p-2">{p.fee_amount}</td>
                  <td className="p-2">{p.is_active ? "Yes" : "No"}</td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}


