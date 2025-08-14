import Link from "next/link";
import DeleteButton from "@/components/ui/DeleteButton";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  CreditCard, 
  Plus, 
  TrendingUp, 
  Users, 
  Calendar,
  DollarSign,
  FileText,
  Download
} from "lucide-react";

async function fetchPayments() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("fee_payments")
    .select(`
      id, 
      receipt_number, 
      amount, 
      payment_date, 
      status,
      payment_method,
      subscription_id,
      membership_subscriptions!inner (
        id,
        start_date,
        end_date,
        status,
        members!inner (
          id,
          member_code,
          personal_info
        ),
        membership_plans!inner (
          plan_name,
          billing_cycle,
          fee_amount
        )
      )
    `)
    .order("payment_date", { ascending: false })
    .limit(100);
  if (error) throw new Error(error.message);
  return data ?? [];
}

async function fetchActiveSubscriptions() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("membership_subscriptions")
    .select(`
      id,
      start_date,
      end_date,
      status,
      members!inner (
        id,
        member_code,
        personal_info
      ),
      membership_plans!inner (
        plan_name,
        billing_cycle,
        fee_amount
      )
    `)
    .eq("status", "active")
    .order("start_date", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

async function fetchAllMembers() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("members")
    .select(`
      id,
      member_code,
      personal_info
    `)
    .eq("is_active", true)
    .order("personal_info->>'first_name'", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

function calculatePaymentStatus(subscription: any, payments: any[]) {
  const currentYear = new Date().getFullYear();
  const subscriptionPayments = payments.filter(p => p.subscription_id === subscription.id);
  const currentYearPayments = subscriptionPayments.filter(p => 
    new Date(p.payment_date).getFullYear() === currentYear && p.status === 'paid'
  );
  
  const totalPaidThisYear = currentYearPayments.reduce((sum, p) => sum + Number(p.amount), 0);
  const expectedAmount = Number(subscription.membership_plans.fee_amount);
  
  if (totalPaidThisYear >= expectedAmount) return 'paid';
  if (totalPaidThisYear > 0) return 'partial';
  return 'pending';
}

function getStatusBadgeProps(status: string) {
  switch (status) {
    case 'paid':
      return { variant: 'default', className: 'bg-green-100 text-green-800 hover:bg-green-100' };
    case 'partial':
      return { variant: 'secondary', className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100' };
    case 'pending':
      return { variant: 'destructive', className: 'bg-red-100 text-red-800 hover:bg-red-100' };
    default:
      return { variant: 'outline' };
  }
}

export default async function MembershipPaymentsPage() {
  const [payments, activeSubscriptions, allMembers] = await Promise.all([
    fetchPayments(), 
    fetchActiveSubscriptions(),
    fetchAllMembers()
  ]);

  const currentYear = new Date().getFullYear();
  
  // Calculate payment statuses for this year
  const subscriptionStatuses = activeSubscriptions.map(sub => ({
    ...sub,
    paymentStatus: calculatePaymentStatus(sub, payments),
    paidThisYear: payments
      .filter(p => p.subscription_id === sub.id && 
                  new Date(p.payment_date).getFullYear() === currentYear && 
                  p.status === 'paid')
      .reduce((sum, p) => sum + Number(p.amount), 0)
  }));

  const paidCount = subscriptionStatuses.filter(s => s.paymentStatus === 'paid').length;
  const partialCount = subscriptionStatuses.filter(s => s.paymentStatus === 'partial').length;
  const pendingCount = subscriptionStatuses.filter(s => s.paymentStatus === 'pending').length;
  const totalRevenue = payments
    .filter(p => p.status === 'paid' && new Date(p.payment_date).getFullYear() === currentYear)
    .reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Membership Payments</h1>
          <p className="text-muted-foreground">
            Track and manage membership fee payments for {currentYear}
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/membership/subscriptions">
            <Button variant="outline" className="gap-2">
              <Users className="h-4 w-4" />
              Manage Subscriptions
            </Button>
          </Link>
          <Link href="/membership/payments/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Record Payment
            </Button>
          </Link>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeSubscriptions.length}</div>
            <p className="text-xs text-muted-foreground">Active subscriptions</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid ({currentYear})</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{paidCount}</div>
            <p className="text-xs text-muted-foreground">
              {activeSubscriptions.length > 0 ? Math.round((paidCount / activeSubscriptions.length) * 100) : 0}% completion rate
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Calendar className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">
              {partialCount > 0 && `${partialCount} partial payments`}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue ({currentYear})</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              From {payments.filter(p => p.status === 'paid' && new Date(p.payment_date).getFullYear() === currentYear).length} payments
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Payment Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Payment Status Overview ({currentYear})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Member</th>
                  <th className="text-left py-3 px-4">Plan</th>
                  <th className="text-left py-3 px-4">Expected</th>
                  <th className="text-left py-3 px-4">Paid</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {subscriptionStatuses.map((sub) => {
                  const memberName = sub.members.personal_info?.full_name || 
                                   sub.members.personal_info?.first_name + ' ' + sub.members.personal_info?.last_name || 
                                   'Unknown';
                  const statusProps = getStatusBadgeProps(sub.paymentStatus);
                  
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
                        <span className="font-medium">₹{sub.membership_plans.fee_amount}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium">₹{sub.paidThisYear}</span>
                      </td>
                      <td className="py-3 px-4">
                        <Badge {...statusProps}>
                          {sub.paymentStatus === 'paid' ? 'Paid' : 
                           sub.paymentStatus === 'partial' ? 'Partial' : 'Pending'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          {sub.paymentStatus !== 'paid' && (
                            <Link
                              href={`/membership/payments/new?subscription_id=${sub.id}&member_name=${encodeURIComponent(memberName)}&amount=${sub.membership_plans.fee_amount}`}
                            >
                              <Button size="sm" variant="outline">
                                <Plus className="h-3 w-3 mr-1" />
                                Pay
                              </Button>
                            </Link>
                          )}
                          <Link href={`/members/${sub.members.id}/edit`}>
                            <Button size="sm" variant="ghost">
                              View
                            </Button>
                          </Link>
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

      {/* Recent Payments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Recent Payments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Receipt</th>
                  <th className="text-left py-3 px-4">Member</th>
                  <th className="text-left py-3 px-4">Date</th>
                  <th className="text-left py-3 px-4">Amount</th>
                  <th className="text-left py-3 px-4">Method</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p: any) => {
                  const memberName = p.membership_subscriptions.members.personal_info?.full_name || 
                                   p.membership_subscriptions.members.personal_info?.first_name + ' ' + 
                                   p.membership_subscriptions.members.personal_info?.last_name || 
                                   'Unknown';
                  return (
                    <tr key={p.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4">
                        <span className="font-mono text-sm">{p.receipt_number}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <Link 
                            href={`/members/${p.membership_subscriptions.members.id}`}
                            className="font-medium hover:text-primary"
                          >
                            {memberName}
                          </Link>
                          <div className="text-sm text-muted-foreground">
                            {p.membership_subscriptions.members.member_code}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span>{new Date(p.payment_date).toLocaleDateString()}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium">₹{Number(p.amount).toLocaleString()}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="capitalize">{p.payment_method || 'N/A'}</span>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={p.status === 'paid' ? 'default' : 'secondary'}>
                          {p.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <Link href={`/api/membership/payments/${p.id}/invoice`} target="_blank">
                            <Button size="sm" variant="outline">
                              <Download className="h-3 w-3 mr-1" />
                              Invoice
                            </Button>
                          </Link>
                          <Link href={`/membership/payments/new?edit=${p.id}`}>
                            <Button size="sm" variant="ghost">
                              Edit
                            </Button>
                          </Link>
                          <DeleteButton endpoint={`/api/membership/payments?id=${p.id}`} />
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

      {/* Member Quick Access */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Quick Member Access
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {allMembers.slice(0, 12).map((member: any) => {
              const memberName = member.personal_info?.full_name || 
                               member.personal_info?.first_name + ' ' + member.personal_info?.last_name || 
                               'Unknown';
              return (
                <Link
                  key={member.id}
                  href={`/members/${member.id}/edit`}
                  className="p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="font-medium text-sm">{memberName}</div>
                  <div className="text-xs text-muted-foreground">{member.member_code}</div>
                </Link>
              );
            })}
          </div>
          <div className="mt-4 text-center">
            <Link href="/members">
              <Button variant="outline">
                View All Members
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}