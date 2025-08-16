"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreditCard, Plus, Calendar, DollarSign } from "lucide-react";
import Link from "next/link";

interface Member {
  id: string;
  member_code: string;
  personal_info: any;
}

interface MembershipPlan {
  plan_name: string;
  fee_amount: number;
  billing_cycle: string;
}

interface Subscription {
  id: string;
  member_id: string;
  start_date: string;
  end_date: string | null;
  status: string;
  members: Member;
  membership_plans: MembershipPlan;
}

interface Payment {
  id: string;
  subscription_id: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  receipt_number: string;
  status: string;
  transaction_id?: string;
}

type Props = {
  memberId: string;
};

export default function MemberPaymentManager({ memberId }: Props) {
  const router = useRouter();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Payment form state
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [transactionId, setTransactionId] = useState<string>("");
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  useEffect(() => {
    fetchMemberData();
  }, [memberId]);

  async function fetchMemberData() {
    setLoading(true);
    try {
      // Fetch member's subscriptions
      const subRes = await fetch(`/api/membership/subscriptions?member_id=${memberId}`);
      if (subRes.ok) {
        const subData = await subRes.json();
        setSubscriptions(subData.data || []);
        
        // If there are subscriptions, fetch payments for them
        if (subData.data && subData.data.length > 0) {
          const subscriptionIds = subData.data.map((sub: Subscription) => sub.id);
          const paymentPromises = subscriptionIds.map((id: string) =>
            fetch(`/api/membership/payments?subscription_id=${id}`)
          );
          
          const paymentResponses = await Promise.all(paymentPromises);
          const allPayments: Payment[] = [];
          
          for (const res of paymentResponses) {
            if (res.ok) {
              const data = await res.json();
              allPayments.push(...(data.data || []));
            }
          }
          
          setPayments(allPayments);
        }
      }
    } catch (err) {
      console.error("Failed to fetch member data:", err);
      setError("Failed to load membership data");
    } finally {
      setLoading(false);
    }
  }

  async function handlePaymentSubmit() {
    if (!selectedSubscriptionId || !amount) {
      setError("Please select a subscription and enter amount");
      return;
    }

    setPaymentLoading(true);
    setError(null);

    try {
      const body = {
        subscription_id: selectedSubscriptionId,
        amount: Number(amount),
        payment_date: paymentDate,
        payment_method: paymentMethod,
        transaction_id: transactionId || undefined,
      };

      const res = await fetch("/api/membership/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const responseData = await res.json();
        const paymentId = responseData.data?.id;
        
        // Download PDF receipt automatically
        if (paymentId) {
          try {
            const { downloadPaymentReceiptPdf } = await import("@/lib/utils/download-pdf");
            await downloadPaymentReceiptPdf(paymentId, `membership-fee-receipt-${responseData.data?.receipt_number || paymentId}.pdf`);
          } catch (pdfError) {
            console.error("Failed to download PDF:", pdfError);
            // Don't show error to user as the payment was successful
          }
        }
        
        // Reset form
        setSelectedSubscriptionId("");
        setAmount("");
        setPaymentMethod("");
        setTransactionId("");
        setShowPaymentForm(false);
        
        // Refresh data
        await fetchMemberData();
        router.refresh();
      } else {
        const errorData = await res.json().catch(() => ({}));
        setError(errorData?.error ? JSON.stringify(errorData.error) : "Failed to record payment");
      }
    } catch (err) {
      console.error("Payment error:", err);
      setError("Failed to record payment");
    } finally {
      setPaymentLoading(false);
    }
  }

  function calculatePaymentStatus(subscription: Subscription): { status: string; paidThisYear: number; totalDue: number } {
    const currentYear = new Date().getFullYear();
    const subscriptionPayments = payments.filter(p => 
      p.subscription_id === subscription.id && 
      new Date(p.payment_date).getFullYear() === currentYear &&
      p.status === 'paid'
    );
    
    const paidThisYear = subscriptionPayments.reduce((sum, p) => sum + Number(p.amount), 0);
    const totalDue = subscription.membership_plans.fee_amount;
    
    if (paidThisYear >= totalDue) return { status: 'paid', paidThisYear, totalDue };
    if (paidThisYear > 0) return { status: 'partial', paidThisYear, totalDue };
    return { status: 'pending', paidThisYear, totalDue };
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading membership data...</div>
        </CardContent>
      </Card>
    );
  }

  if (subscriptions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Membership Payments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <p className="text-muted-foreground mb-4">No active membership subscriptions found</p>
            <Link 
              href={`/membership/subscriptions/new?member_id=${memberId}`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded hover:opacity-90"
            >
              <Plus className="h-4 w-4" />
              Create Subscription
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Membership Payments
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Subscription Status Overview */}
        <div className="space-y-3">
          <h4 className="font-medium">Active Subscriptions</h4>
          {subscriptions.map((subscription) => {
            const paymentStatus = calculatePaymentStatus(subscription);
            return (
              <div key={subscription.id} className="border rounded p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{subscription.membership_plans.plan_name}</div>
                    <div className="text-sm text-muted-foreground">
                      {subscription.membership_plans.billing_cycle} • ₹{subscription.membership_plans.fee_amount}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      paymentStatus.status === 'paid' ? 'bg-green-100 text-green-800' :
                      paymentStatus.status === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {paymentStatus.status}
                    </span>
                    <div className="text-sm text-muted-foreground mt-1">
                      ₹{paymentStatus.paidThisYear} / ₹{paymentStatus.totalDue}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Recent Payments */}
        {payments.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium">Recent Payments</h4>
            <div className="space-y-2">
              {payments.slice(0, 5).map((payment) => {
                const subscription = subscriptions.find(s => s.id === payment.subscription_id);
                return (
                  <div key={payment.id} className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded">
                    <div>
                      <div className="text-sm font-medium">₹{payment.amount}</div>
                      <div className="text-xs text-muted-foreground">
                        {subscription?.membership_plans.plan_name} • {new Date(payment.payment_date).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-medium">{payment.receipt_number}</div>
                      <div className="text-xs text-muted-foreground">{payment.payment_method}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Add Payment Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Record New Payment</h4>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPaymentForm(!showPaymentForm)}
            >
              <Plus className="h-4 w-4 mr-2" />
              {showPaymentForm ? "Cancel" : "Add Payment"}
            </Button>
          </div>

          {showPaymentForm && (
            <div className="space-y-4 p-4 border rounded">
              <div>
                <Label>Subscription</Label>
                <Select value={selectedSubscriptionId} onValueChange={setSelectedSubscriptionId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select subscription" />
                  </SelectTrigger>
                  <SelectContent>
                    {subscriptions.map((sub) => (
                      <SelectItem key={sub.id} value={sub.id}>
                        {sub.membership_plans.plan_name} - ₹{sub.membership_plans.fee_amount}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Amount</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label>Payment Date</Label>
                  <Input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label>Payment Method</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="upi">UPI</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Transaction ID (Optional)</Label>
                <Input
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  placeholder="Transaction reference"
                />
              </div>

              {error && (
                <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                  {error}
                </div>
              )}

              <div className="flex gap-2">
                <Button 
                  onClick={handlePaymentSubmit} 
                  disabled={paymentLoading || !selectedSubscriptionId || !amount}
                  className="flex-1"
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  {paymentLoading ? "Recording..." : "Record Payment"}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2 pt-2 border-t">
          <Link 
            href="/membership/payments"
            className="text-sm text-blue-600 hover:text-blue-800 underline"
          >
            View All Payments
          </Link>
          <Link 
            href={`/membership/subscriptions/new?member_id=${memberId}`}
            className="text-sm text-blue-600 hover:text-blue-800 underline"
          >
            Add Subscription
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
