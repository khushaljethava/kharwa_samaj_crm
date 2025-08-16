"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  User, 
  CreditCard, 
  Download, 
  CheckCircle, 
  AlertCircle,
  ArrowLeft
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

interface Member {
  id: string;
  member_code: string | null;
  personal_info: {
    first_name?: string;
    last_name?: string;
    full_name?: string;
  } | null;
  is_active: boolean;
  membership_info?: {
    last_payment_date?: string;
    membership_type?: string;
  } | null;
}

interface MembershipPayment {
  id: string;
  member_id: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  receipt_number: string;
  notes?: string;
}

export default function MembershipFeePage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "upi" | "other">("cash");
  const [notes, setNotes] = useState("");
  const [recentPayments, setRecentPayments] = useState<MembershipPayment[]>([]);

  useEffect(() => {
    fetchInactiveMembers();
    fetchRecentPayments();
  }, []);

  async function fetchInactiveMembers() {
    try {
      const response = await fetch("/api/members?status=inactive&limit=100");
      if (response.ok) {
        const data = await response.json();
        setMembers(data.members || []);
      } else {
        toast.error("Failed to fetch members");
      }
    } catch (error) {
      console.error("Error fetching members:", error);
      toast.error("Error loading members");
    } finally {
      setLoading(false);
    }
  }

  async function fetchRecentPayments() {
    try {
      const response = await fetch("/api/membership-fees?limit=10");
      if (response.ok) {
        const data = await response.json();
        setRecentPayments(data.payments || []);
      }
    } catch (error) {
      console.error("Error fetching recent payments:", error);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!selectedMemberId || !amount || Number(amount) <= 0) {
      toast.error("Please select a member and enter a valid amount");
      return;
    }

    setSubmitting(true);

    try {
      const paymentData = {
        member_id: selectedMemberId,
        amount: Number(amount),
        payment_method: paymentMethod,
        notes: notes || undefined,
      };

      const response = await fetch("/api/membership-fees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paymentData),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success("Membership fee payment recorded successfully!");
        
        // Reset form
        setSelectedMemberId("");
        setAmount("");
        setNotes("");
        
        // Refresh data
        fetchInactiveMembers();
        fetchRecentPayments();
        
        // Download invoice
        downloadInvoice(data.payment.id);
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to record payment");
      }
    } catch (error) {
      console.error("Error recording payment:", error);
      toast.error("Error recording payment");
    } finally {
      setSubmitting(false);
    }
  }

  async function downloadInvoice(paymentId: string) {
    try {
      const response = await fetch(`/api/membership-fees/${paymentId}/invoice`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `membership-invoice-${paymentId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error("Error downloading invoice:", error);
      toast.error("Failed to download invoice");
    }
  }

  function getMemberDisplayName(member: Member): string {
    if (member.personal_info?.full_name) {
      return member.personal_info.full_name;
    }
    if (member.personal_info?.first_name || member.personal_info?.last_name) {
      return `${member.personal_info.first_name || ""} ${member.personal_info.last_name || ""}`.trim();
    }
    return member.member_code || member.id.slice(0, 8);
  }

  const selectedMember = members.find(m => m.id === selectedMemberId);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading membership fee collection...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Collect Membership Fee</h1>
            <p className="text-muted-foreground">
              Record membership payments and activate members
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Payment Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Record Payment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Member Selection */}
              <div>
                <Label htmlFor="member">Select Member *</Label>
                <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a member" />
                  </SelectTrigger>
                  <SelectContent>
                    {members.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        <div className="flex items-center gap-2">
                          <span>{getMemberDisplayName(member)}</span>
                          {member.member_code && (
                            <Badge variant="secondary" className="text-xs">
                              {member.member_code}
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {members.length === 0 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    No inactive members found. All members are currently active.
                  </p>
                )}
              </div>

              {/* Amount */}
              <div>
                <Label htmlFor="amount">Amount (₹) *</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              {/* Payment Method */}
              <div>
                <Label htmlFor="paymentMethod">Payment Method *</Label>
                <Select value={paymentMethod} onValueChange={(value: any) => setPaymentMethod(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="upi">UPI</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Notes */}
              <div>
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any additional notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Submit Button */}
              <Button 
                type="submit" 
                disabled={submitting || !selectedMemberId || !amount || members.length === 0}
                className="w-full"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Recording Payment...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Record Payment & Activate Member
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Member Info & Recent Payments */}
        <div className="space-y-6">
          {/* Selected Member Info */}
          {selectedMember && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Member Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Name:</span>
                  <span className="font-medium">{getMemberDisplayName(selectedMember)}</span>
                </div>
                {selectedMember.member_code && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Member Code:</span>
                    <Badge variant="outline">{selectedMember.member_code}</Badge>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <Badge variant="destructive">Inactive</Badge>
                </div>
                {selectedMember.membership_info?.last_payment_date && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Last Payment:</span>
                    <span className="text-sm">
                      {new Date(selectedMember.membership_info.last_payment_date).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Recent Payments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Recent Payments
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentPayments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No recent payments
                </p>
              ) : (
                <div className="space-y-3">
                  {recentPayments.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium text-sm">
                          Receipt: {payment.receipt_number}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(payment.payment_date).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">₹{payment.amount}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => downloadInvoice(payment.id)}
                        >
                          <Download className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
