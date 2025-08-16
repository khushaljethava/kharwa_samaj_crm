"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type RentSource = { id: string; name: string };
type RentalAgreement = { 
  id: string; 
  property_id: string;
  agreement_details: any;
  monthly_rent: number;
  status: string;
  properties?: {
    property_code: string;
    property_details: any;
  };
};

type RentPayment = {
  id: string;
  agreement_id: string | null;
  payment_month: string;
  amount_due: number;
  amount_paid: number;
  payment_date: string | null;
  payment_method: string | null;
  transaction_reference: string | null;
  receiver_name: string | null;
  source_id: string | null;
  status: string;
  metadata: any;
};

export default function EditRentPaymentPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [payment, setPayment] = useState<RentPayment | null>(null);
  const [sources, setSources] = useState<RentSource[]>([]);
  const [agreements, setAgreements] = useState<RentalAgreement[]>([]);
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const { id } = await params;
        
        // Load payment data
        const paymentRes = await fetch(`/api/rent/payments/${id}`);
        if (!paymentRes.ok) {
          throw new Error("Payment not found");
        }
        const paymentData = await paymentRes.json();
        setPayment(paymentData.data);

        // Load rent sources
        const sourcesRes = await fetch("/api/rent/sources");
        const sourcesJson = await sourcesRes.json().catch(() => ({}));
        setSources((sourcesJson?.data || []).filter((s: any) => s.is_active));

        // Load rental agreements
        try {
          const agreementsRes = await fetch("/api/rental-agreements?status=active");
          const agreementsJson = await agreementsRes.json().catch(() => ({}));
          setAgreements(agreementsJson?.data || []);
        } catch (err) {
          console.log("Rental agreements not available:", err);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load payment");
      } finally {
        setDataLoading(false);
      }
    }
    loadData();
  }, [params]);

  async function onSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    
    try {
      const { id } = await params;
      
      // Get form values and handle empty strings properly
      const agreementId = formData.get("agreement_id");
      const sourceId = formData.get("source_id");
      
      const body = {
        agreement_id: agreementId && agreementId !== "" ? String(agreementId) : null,
        payment_month: String(formData.get("payment_month") || ""),
        months_covered: Number(formData.get("months_covered") || 1),
        amount_due: Number(formData.get("amount_due") || 0),
        amount_paid: Number(formData.get("amount_paid") || 0),
        payment_method: String(formData.get("payment_method") || ""),
        transaction_reference: String(formData.get("transaction_reference") || ""),
        receiver_name: String(formData.get("receiver_name") || ""),
        source_id: sourceId && sourceId !== "" ? String(sourceId) : null,
        status: String(formData.get("status") || "paid"),
      };

      const res = await fetch(`/api/rent/payments/${id}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        router.push("/rent/collections");
      } else {
        const j = await res.json().catch(() => ({}));
        setError(j?.error ? JSON.stringify(j.error) : "Failed to update");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update payment");
    } finally {
      setLoading(false);
    }
  }

  if (dataLoading) {
    return <div className="space-y-6 max-w-xl">Loading...</div>;
  }

  if (error || !payment) {
    return (
      <div className="space-y-6 max-w-xl">
        <h1 className="text-xl font-semibold">Edit Rent Payment</h1>
        <p className="text-red-600">{error || "Payment not found"}</p>
        <Button onClick={() => router.push("/rent/collections")}>Back to Collections</Button>
      </div>
    );
  }

  // Get source_id from metadata
  const sourceId = payment.metadata?.source_id;
  const monthsCovered = payment.metadata?.months_covered || 1;

  return (
    <div className="space-y-6 max-w-xl">
      <h1 className="text-xl font-semibold">Edit Rent Payment</h1>
      <form action={onSubmit} className="space-y-4">
        {/* Optional Rental Agreement Selection */}
        {agreements.length > 0 && (
          <div>
            <Label htmlFor="agreement_id">Rental Agreement (Optional)</Label>
            <Select defaultValue={payment.agreement_id || ""} onValueChange={(v) => {
              const el = document.querySelector<HTMLInputElement>('input[name="agreement_id"]');
              if (el) el.value = v;
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Select agreement (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None (General rent payment)</SelectItem>
                {agreements.map((agreement) => (
                  <SelectItem key={agreement.id} value={agreement.id}>
                    {agreement.properties?.property_code || `Property ${agreement.property_id.slice(0, 8)}`} - ₹{agreement.monthly_rent}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <input type="hidden" name="agreement_id" value={payment.agreement_id || ""} />
          </div>
        )}
        <div>
          <Label htmlFor="payment_month">Payment Month</Label>
          <Input 
            name="payment_month" 
            id="payment_month" 
            type="month" 
            defaultValue={payment.payment_month.slice(0, 7)} 
            required 
          />
        </div>
        <div>
          <Label htmlFor="months_covered">Months Covered</Label>
          <Select defaultValue={String(monthsCovered)} onValueChange={(v) => {
            const el = document.querySelector<HTMLInputElement>('input[name="months_covered"]');
            if (el) el.value = v;
          }}>
            <SelectTrigger>
              <SelectValue placeholder="1" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 24 }).map((_, i) => (
                <SelectItem key={i + 1} value={String(i + 1)}>{i + 1}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <input type="hidden" name="months_covered" value={monthsCovered} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="amount_due">Amount Due</Label>
            <Input 
              name="amount_due" 
              id="amount_due" 
              type="number" 
              min="0" 
              step="0.01" 
              defaultValue={payment.amount_due}
              required 
            />
          </div>
          <div>
            <Label htmlFor="amount_paid">Amount Paid</Label>
            <Input 
              name="amount_paid" 
              id="amount_paid" 
              type="number" 
              min="0" 
              step="0.01" 
              defaultValue={payment.amount_paid}
              required 
            />
          </div>
        </div>
        <div>
          <Label htmlFor="source_id">Source</Label>
          <Select defaultValue={sourceId || ""} onValueChange={(v) => {
            const el = document.querySelector<HTMLInputElement>('input[name="source_id"]');
            if (el) el.value = v;
          }}>
            <SelectTrigger>
              <SelectValue placeholder="Select source" />
            </SelectTrigger>
            <SelectContent>
              {sources.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <input type="hidden" name="source_id" value={sourceId || ""} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="payment_method">Payment Method</Label>
            <Input 
              name="payment_method" 
              id="payment_method" 
              placeholder="cash/bank/upi" 
              defaultValue={payment.payment_method || ""}
            />
          </div>
          <div>
            <Label htmlFor="transaction_reference">Transaction Reference</Label>
            <Input 
              name="transaction_reference" 
              id="transaction_reference" 
              placeholder="Txn ID" 
              defaultValue={payment.transaction_reference || ""}
            />
          </div>
        </div>
        <div>
          <Label htmlFor="receiver_name">Receiver Name</Label>
          <Input 
            name="receiver_name" 
            id="receiver_name" 
            placeholder="Name of person who received payment" 
            defaultValue={payment.receiver_name || ""}
          />
        </div>
        <div>
          <Label htmlFor="status">Status</Label>
          <Input 
            name="status" 
            id="status" 
            defaultValue={payment.status} 
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-4">
          <Button disabled={loading}>
            {loading ? "Updating…" : "Update Payment"}
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => router.push("/rent/collections")}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
