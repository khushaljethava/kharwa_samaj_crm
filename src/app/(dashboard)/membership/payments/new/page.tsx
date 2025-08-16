"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  CreditCard, 
  User, 
  Calendar, 
  IndianRupee, 
  Search,
  AlertCircle,
  CheckCircle,
  ArrowLeft
} from "lucide-react";

interface Member {
  id: string;
  member_code: string;
  personal_info: any;
}

interface Subscription {
  id: string;
  member_id: string;
  start_date: string;
  end_date: string | null;
  status: string;
  members: Member;
  membership_plans: {
    plan_name: string;
    fee_amount: number;
    billing_cycle: string;
  };
}

interface AllMember {
  id: string;
  member_code: string;
  personal_info: any;
}

export default function NewMembershipPaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [allMembers, setAllMembers] = useState<AllMember[]>([]);
  const [selectedSubscription, setSelectedSubscription] = useState<string>("");
  const [selectedMember, setSelectedMember] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [memberSearchTerm, setMemberSearchTerm] = useState("");
  
  // Form data
  const [amount, setAmount] = useState<string>("");
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [transactionId, setTransactionId] = useState<string>("");

  // Pre-fill from URL params
  const prefilledSubscriptionId = searchParams.get("subscription_id");
  const prefilledMemberName = searchParams.get("member_name");
  const prefilledAmount = searchParams.get("amount");

  useEffect(() => {
    fetchData();
    if (prefilledSubscriptionId) {
      setSelectedSubscription(prefilledSubscriptionId);
    }
    if (prefilledAmount) {
      setAmount(prefilledAmount);
    }
  }, [prefilledSubscriptionId, prefilledAmount]);

  async function fetchData() {
    setDataLoading(true);
    setError(null);
    try {
      const [subscriptionsRes, membersRes] = await Promise.all([
        fetch("/api/membership/subscriptions"),
        fetch("/api/members?limit=500")
      ]);
      
      if (subscriptionsRes.ok) {
        const subscriptionsData = await subscriptionsRes.json();
        setSubscriptions(subscriptionsData.data || []);
        console.log("Subscriptions loaded:", subscriptionsData.data?.length || 0);
      } else {
        console.error("Failed to fetch subscriptions:", subscriptionsRes.status);
        const subscriptionsError = await subscriptionsRes.text();
        console.error("Subscriptions error details:", subscriptionsError);
        setError("Failed to load subscriptions. Please refresh the page.");
      }
      
      if (membersRes.ok) {
        const membersData = await membersRes.json();
        setAllMembers(membersData.data || []);
        console.log("Members loaded:", membersData.data?.length || 0);
      } else {
        console.error("Failed to fetch members:", membersRes.status);
        const membersError = await membersRes.text();
        console.error("Members error details:", membersError);
        setError("Failed to load members list. Please refresh the page.");
      }
    } catch (err) {
      console.error("Failed to fetch data:", err);
      setError("Network error while loading data. Please check your connection and refresh the page.");
    } finally {
      setDataLoading(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    if (!selectedSubscription) {
      setError("Please select a member subscription");
      setLoading(false);
      return;
    }
    
    if (!amount || Number(amount) <= 0) {
      setError("Please enter a valid amount");
      setLoading(false);
      return;
    }

    const body = { 
      subscription_id: selectedSubscription, 
      amount: Number(amount), 
      payment_date: paymentDate,
      payment_method: paymentMethod,
      transaction_id: transactionId || undefined
    };

    try {
    const res = await fetch("/api/membership/payments", {
      method: "POST",
      headers: { "content-type": "application/json" },
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
        
        setSuccess(`Payment recorded successfully! Receipt: ${responseData.data?.receipt_number || 'Generated'} (PDF downloaded)`);
        
        // Reset form
        setSelectedSubscription("");
        setSelectedMember("");
        setAmount("");
        setPaymentMethod("");
        setTransactionId("");
        
        // Redirect after a short delay
        setTimeout(() => {
          router.push("/membership/payments");
        }, 2000);
      } else {
        const errorData = await res.json().catch(() => ({}));
        setError(errorData?.error ? JSON.stringify(errorData.error) : "Failed to record payment");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
    setLoading(false);
    }
  }

  // Filter subscriptions based on search
  const filteredSubscriptions = subscriptions.filter(sub => {
    const memberName = sub.members.personal_info?.full_name || 
                      sub.members.personal_info?.first_name + ' ' + sub.members.personal_info?.last_name || 
                      '';
    return memberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           sub.members.member_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           sub.membership_plans.plan_name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Filter members for quick selection
  const filteredMembers = allMembers.filter(member => {
    const memberName = member.personal_info?.full_name || 
                      member.personal_info?.first_name + ' ' + member.personal_info?.last_name || 
                      '';
    return memberName.toLowerCase().includes(memberSearchTerm.toLowerCase()) ||
           member.member_code?.toLowerCase().includes(memberSearchTerm.toLowerCase());
  });

  // Get member subscriptions when a member is selected
  const memberSubscriptions = selectedMember ? 
    subscriptions.filter(sub => sub.member_id === selectedMember) : [];

  const selectedSub = subscriptions.find(s => s.id === selectedSubscription);

  // Auto-fill amount when subscription is selected
  useEffect(() => {
    if (selectedSub && !prefilledAmount) {
      setAmount(selectedSub.membership_plans.fee_amount.toString());
    }
  }, [selectedSub, prefilledAmount]);

    if (dataLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-4">
          <Link href="/membership/payments">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Payments
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Record Membership Payment</h1>
            <p className="text-muted-foreground mt-1">Loading data...</p>
          </div>
        </div>
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading members and subscriptions...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/membership/payments">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Payments
          </Button>
        </Link>
      <div>
          <h1 className="text-3xl font-bold tracking-tight">Record Membership Payment</h1>
        {prefilledMemberName && (
            <p className="text-muted-foreground mt-1">Recording payment for: {prefilledMemberName}</p>
        )}
        </div>
      </div>
      
      {/* Alert Messages */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {success && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-green-800">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm">{success}</span>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Payment Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={onSubmit} className="space-y-6">
                {/* Member Selection (Alternative Method) */}
                <div className="space-y-3">
                  <Label className="text-base font-medium">Select Member (Optional)</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search members by name or code..."
                      value={memberSearchTerm}
                      onChange={(e) => setMemberSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  {memberSearchTerm && (
                    <div className="border rounded-lg max-h-48 overflow-y-auto">
                      {filteredMembers.slice(0, 10).map((member) => {
                        const memberName = member.personal_info?.full_name || 
                                         member.personal_info?.first_name + ' ' + member.personal_info?.last_name || 
                                         'Unknown';
                        return (
                          <button
                            key={member.id}
                            type="button"
                            onClick={() => {
                              setSelectedMember(member.id);
                              setMemberSearchTerm(memberName);
                              setSelectedSubscription(""); // Reset subscription selection
                            }}
                            className="w-full text-left p-3 hover:bg-muted border-b last:border-b-0"
                          >
                            <div className="font-medium">{memberName}</div>
                            <div className="text-sm text-muted-foreground">{member.member_code}</div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Subscription Selection */}
                <div className="space-y-3">
                  <Label className="text-base font-medium">
                    {selectedMember ? "Select Subscription" : "Search & Select Member Subscription"}
                  </Label>
                  {!selectedMember && !prefilledSubscriptionId && (
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
              placeholder="Search by member name, code, or plan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9"
            />
                    </div>
          )}
                  <Select 
            value={selectedSubscription}
                    onValueChange={setSelectedSubscription}
            disabled={!!prefilledSubscriptionId}
          >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a member subscription..." />
                    </SelectTrigger>
                    <SelectContent>
                      {(selectedMember ? memberSubscriptions : filteredSubscriptions).map((sub) => {
              const memberName = sub.members.personal_info?.full_name || 
                               sub.members.personal_info?.first_name + ' ' + sub.members.personal_info?.last_name || 
                               'Unknown';
              return (
                          <SelectItem key={sub.id} value={sub.id}>
                  {memberName} ({sub.members.member_code}) - {sub.membership_plans.plan_name} - ₹{sub.membership_plans.fee_amount}
                          </SelectItem>
              );
            })}
                    </SelectContent>
                  </Select>
        </div>

                {/* Payment Amount & Date */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount (₹)</Label>
                    <div className="relative">
                      <IndianRupee className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="amount"
              type="number" 
              step="0.01" 
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        className="pl-9"
              required 
            />
          </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="payment_date">Payment Date</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="payment_date"
              type="date" 
                        value={paymentDate}
                        onChange={(e) => setPaymentDate(e.target.value)}
                        className="pl-9"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Payment Method & Transaction ID */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Payment Method</Label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select method..." />
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
                  <div className="space-y-2">
                    <Label htmlFor="transaction_id">Transaction ID (Optional)</Label>
                    <Input
                      id="transaction_id"
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                      placeholder="Transaction reference"
            />
          </div>
        </div>

                {/* Submit Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button 
                    type="submit"
                    disabled={loading || !selectedSubscription || !amount}
                    className="flex-1"
                  >
                    {loading ? "Recording..." : "Record Payment"}
                  </Button>
                  <Link href="/membership/payments">
                    <Button type="button" variant="outline">
                      Cancel
                    </Button>
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Subscription Details Sidebar */}
        <div>
          {selectedSub && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Selected Subscription
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Member</Label>
                  <div className="font-medium">
                    {selectedSub.members.personal_info?.full_name || 'Unknown'}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {selectedSub.members.member_code}
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm text-muted-foreground">Plan</Label>
                  <div className="font-medium">{selectedSub.membership_plans.plan_name}</div>
                  <Badge variant="outline" className="mt-1">
                    {selectedSub.membership_plans.billing_cycle}
                  </Badge>
                </div>
                
                <div>
                  <Label className="text-sm text-muted-foreground">Expected Amount</Label>
                  <div className="text-lg font-bold text-primary">
                    ₹{selectedSub.membership_plans.fee_amount}
                  </div>
                </div>

                <div>
                  <Label className="text-sm text-muted-foreground">Status</Label>
                  <div>
                    <Badge variant={selectedSub.status === 'active' ? 'default' : 'secondary'}>
                      {selectedSub.status}
                    </Badge>
                  </div>
        </div>

                <div className="pt-2 border-t">
                  <Link href={`/members/${selectedSub.members.id}`}>
                    <Button variant="outline" size="sm" className="w-full">
                      View Member Profile
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Stats */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-base">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Subscriptions:</span>
                <span className="font-medium">{subscriptions.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Members:</span>
                <span className="font-medium">{allMembers.length}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}