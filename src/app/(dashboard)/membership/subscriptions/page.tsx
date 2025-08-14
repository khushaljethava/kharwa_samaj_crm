import Link from "next/link";
import DeleteButton from "@/components/ui/DeleteButton";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  UserCheck, 
  Plus, 
  Users, 
  Calendar,
  CreditCard,
  TrendingUp,
  Clock,
  DollarSign
} from "lucide-react";

async function fetchSubscriptions() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("membership_subscriptions")
    .select(`
      id,
      start_date,
      end_date,
      status,
      auto_renew,
      members!inner (
        id,
        member_code,
        personal_info
      ),
      membership_plans!inner (
        plan_name,
        fee_amount,
        billing_cycle
      )
    `)
    .order("start_date", { ascending: false })
    .limit(100);
  if (error) throw new Error(error.message);
  return data ?? [];
}

async function fetchMembershipPlans() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("membership_plans")
    .select(`
      id,
      plan_name,
      plan_type,
      fee_amount,
      billing_cycle,
      is_active
    `)
    .eq("is_active", true)
    .order("plan_name", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

function getStatusBadgeProps(status: string) {
  switch (status) {
    case 'active':
      return { variant: 'default', className: 'bg-green-100 text-green-800 hover:bg-green-100' };
    case 'expired':
      return { variant: 'destructive', className: 'bg-red-100 text-red-800 hover:bg-red-100' };
    case 'cancelled':
      return { variant: 'secondary', className: 'bg-gray-100 text-gray-800 hover:bg-gray-100' };
    case 'suspended':
      return { variant: 'secondary', className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100' };
    default:
      return { variant: 'outline' };
  }
}

function isSubscriptionExpiring(subscription: any): boolean {
  if (!subscription.end_date) return false;
  const endDate = new Date(subscription.end_date);
  const now = new Date();
  const daysUntilExpiry = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
}

export default async function MembershipSubscriptionsPage() {
  const [subscriptions, membershipPlans] = await Promise.all([
    fetchSubscriptions(),
    fetchMembershipPlans()
  ]);
  
  const activeCount = subscriptions.filter(s => s.status === 'active').length;
  const expiredCount = subscriptions.filter(s => s.status === 'expired').length;
  const cancelledCount = subscriptions.filter(s => s.status === 'cancelled').length;
  const suspendedCount = subscriptions.filter(s => s.status === 'suspended').length;
  const expiringCount = subscriptions.filter(s => s.status === 'active' && isSubscriptionExpiring(s)).length;
  
  const totalRevenue = subscriptions
    .filter(s => s.status === 'active')
    .reduce((sum, s) => sum + Number(s.membership_plans.fee_amount), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Membership Subscriptions</h1>
          <p className="text-muted-foreground">
            Manage member subscriptions and membership plans
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/membership/plans">
            <Button variant="outline" className="gap-2">
              <CreditCard className="h-4 w-4" />
              Manage Plans
            </Button>
          </Link>
          <Link href="/membership/subscriptions/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Subscription
            </Button>
          </Link>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Subscriptions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{subscriptions.length}</div>
            <p className="text-xs text-muted-foreground">All subscriptions</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeCount}</div>
            <p className="text-xs text-muted-foreground">
              {subscriptions.length > 0 ? Math.round((activeCount / subscriptions.length) * 100) : 0}% of total
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{expiringCount}</div>
            <p className="text-xs text-muted-foreground">Within 30 days</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive</CardTitle>
            <Calendar className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{expiredCount + cancelledCount + suspendedCount}</div>
            <p className="text-xs text-muted-foreground">
              {expiredCount} expired, {cancelledCount} cancelled
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Annual Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">From active subscriptions</p>
          </CardContent>
        </Card>
      </div>

      {/* Expiring Subscriptions Alert */}
      {expiringCount > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800">
              <Clock className="h-5 w-5" />
              {expiringCount} Subscription{expiringCount > 1 ? 's' : ''} Expiring Soon
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-yellow-700">
              These subscriptions will expire within the next 30 days. Consider reaching out to members for renewal.
            </p>
            <div className="mt-2">
              <Link href="/membership/payments">
                <Button size="sm" variant="outline" className="border-yellow-300 text-yellow-800 hover:bg-yellow-100">
                  View Payment Status
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Subscriptions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            All Subscriptions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Member</th>
                  <th className="text-left py-3 px-4">Plan</th>
                  <th className="text-left py-3 px-4">Fee Amount</th>
                  <th className="text-left py-3 px-4">Period</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Auto Renew</th>
                  <th className="text-left py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((sub: any) => {
                  const memberName = sub.members.personal_info?.full_name || 
                                   sub.members.personal_info?.first_name + ' ' + sub.members.personal_info?.last_name || 
                                   'Unknown';
                  const statusProps = getStatusBadgeProps(sub.status);
                  const isExpiring = isSubscriptionExpiring(sub);
                  
                  return (
                    <tr key={sub.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4">
                        <div>
                          <Link 
                            href={`/members/${sub.members.id}`}
                            className="font-medium hover:text-primary"
                          >
                            {memberName}
                          </Link>
                          <div className="text-sm text-muted-foreground">{sub.members.member_code}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium">{sub.membership_plans.plan_name}</div>
                          <div className="text-sm text-muted-foreground">{sub.membership_plans.billing_cycle}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium">₹{Number(sub.membership_plans.fee_amount).toLocaleString()}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm">
                          <div>
                            <span className="text-muted-foreground">Start: </span>
                            {new Date(sub.start_date).toLocaleDateString()}
                          </div>
                          {sub.end_date && (
                            <div className={isExpiring ? 'text-yellow-600 font-medium' : ''}>
                              <span className="text-muted-foreground">End: </span>
                              {new Date(sub.end_date).toLocaleDateString()}
                              {isExpiring && ' (Soon)'}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge {...statusProps}>
                          {sub.status}
                        </Badge>
                        {isExpiring && (
                          <Badge variant="secondary" className="ml-1 bg-yellow-100 text-yellow-800">
                            Expiring
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={sub.auto_renew ? 'default' : 'outline'}>
                          {sub.auto_renew ? 'Yes' : 'No'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <Link 
                            href={`/membership/payments/new?subscription_id=${sub.id}&member_name=${encodeURIComponent(memberName)}&amount=${sub.membership_plans.fee_amount}`}
                          >
                            <Button size="sm" variant="outline">
                              <CreditCard className="h-3 w-3 mr-1" />
                              Payment
                            </Button>
                          </Link>
                          <Link href={`/members/${sub.members.id}/edit`}>
                            <Button size="sm" variant="ghost">
                              View
                            </Button>
                          </Link>
                          <DeleteButton endpoint={`/api/membership/subscriptions?id=${sub.id}`} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Available Plans Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Available Membership Plans
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {membershipPlans.map((plan: any) => (
              <div key={plan.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium">{plan.plan_name}</h4>
                    <p className="text-sm text-muted-foreground">{plan.plan_type}</p>
                    <p className="text-lg font-bold text-primary mt-1">₹{Number(plan.fee_amount).toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">{plan.billing_cycle}</p>
                  </div>
                  <Badge variant="outline">
                    {subscriptions.filter(s => s.membership_plans.plan_name === plan.plan_name && s.status === 'active').length} active
                  </Badge>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 text-center">
            <Link href="/membership/plans/new">
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Create New Plan
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}