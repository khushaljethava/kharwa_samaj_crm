"use client";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart } from "@/components/ui/chart";
import { Download, TrendingUp, TrendingDown } from "lucide-react";

export default function ProfitLossReportPage() {
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [_error, setError] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setError(null);
    const qs = new URLSearchParams();
    if (start) qs.set("start", start);
    if (end) qs.set("end", end);
    const res = await fetch(`/api/reports/profit-loss?${qs.toString()}`);
    setLoading(false);
    if (!res.ok) {
      setError("Failed to load");
      return;
    }
    const j = await res.json();
    setData(j);
  }

  function exportCsv() {
    if (!data) return;
    const header = ["Category","Date","Reference","Description","Amount"];
    const rows: string[][] = [header];
    const pushRows = (cat: string, rowsData: any[], mapper: (r: any) => string[]) => {
      for (const r of rowsData || []) rows.push([cat, ...mapper(r)]);
    };
    pushRows("Donation", data.donations?.rows, (r) => [r.donation_date || "", r.id, r.donor_name || r.member_id || "", String(r.amount || 0)]);
    pushRows("Rent", data.rent?.rows, (r) => [r.payment_month || "", r.id, r.payment_method || "", String(r.amount_paid || 0)]);
    pushRows("Membership", data.membership_fees?.rows, (r) => [r.payment_date || "", r.receipt_number || r.id, r.payment_method || "", String(r.amount || 0)]);
    pushRows("InventoryRental", data.inventory_rentals?.rows, (r) => [r.created_at || "", r.invoice_number || r.id, r.member_id || "", String(r.total_amount || 0)]);
    const csv = rows.map((r) => r.map((c) => String(c).replaceAll('"','""')).map((c)=>`"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `profit_loss_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Derived chart data if available
  const monthly = (() => {
    if (!data) return [] as Array<{ label: string; value: number }>;
    // very rough monthly buckets from income rows
    const buckets: Record<string, number> = {};
    const add = (d?: string, v?: number) => {
      if (!d) return;
      const dt = new Date(d);
      if (Number.isNaN(dt.getTime())) return;
      const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
      buckets[key] = (buckets[key] || 0) + Number(v || 0);
    };
    (data.donations?.rows || []).forEach((r: any) => add(r.donation_date, r.amount));
    (data.rent?.rows || []).forEach((r: any) => add(r.payment_month, r.amount_paid));
    (data.membership_fees?.rows || []).forEach((r: any) => add(r.payment_date, r.amount));
    (data.inventory_rentals?.rows || []).forEach((r: any) => add(r.created_at, r.total_amount));
    const keys = Object.keys(buckets).sort();
    return keys.map((k) => ({ label: `${k.slice(5)}/${k.slice(2,4)}`, value: buckets[k] }));
  })();

  return (
    <div className="space-y-6 max-w-5xl">
      <h1 className="text-2xl font-bold tracking-tight">Profit & Loss</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <div className="text-xs text-muted-foreground">Start date</div>
          <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
        </div>
        <div>
          <div className="text-xs text-muted-foreground">End date</div>
          <Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
        </div>
        <div className="flex items-end gap-2">
          <Button onClick={run} disabled={loading}>{loading ? "Loading…" : "Run"}</Button>
          <Button variant="outline" onClick={exportCsv} disabled={!data}>
            <Download className="h-4 w-4 mr-2" /> Export CSV
          </Button>
        </div>
      </div>
      {data && (
        <div className="space-y-6">
          <SummaryCard data={data} />
          {monthly.length > 1 && (
            <LineChart title="Monthly Income" data={monthly} height={240} />
          )}
          <DataTable title="Donations" columns={["Date","Donor/Member","Method","Amount"]} rows={(data.donations?.rows||[]).map((r:any)=>[r.donation_date||"", r.donor_name||r.member_id||"—", r.payment_method||"—", r.amount])} />
          <DataTable title="Rent Payments" columns={["Month","Method","Status","Paid","Due","Months Covered"]} rows={(data.rent?.rows||[]).map((r:any)=>[r.payment_month||"", r.payment_method||"—", r.status||"—", r.amount_paid, r.amount_due, r.metadata?.months_covered||1])} />
          <DataTable title="Membership Fees" columns={["Date","Receipt","Method","Amount","Status"]} rows={(data.membership_fees?.rows||[]).map((r:any)=>[r.payment_date||"", r.receipt_number||r.id, r.payment_method||"—", r.amount, r.status||"—"]) } />
          <DataTable title="Inventory Rentals" columns={["Date","Invoice","Member","Total","Deposit","Status"]} rows={(data.inventory_rentals?.rows||[]).map((r:any)=>[r.created_at||"", r.invoice_number||r.id, r.member_id||"—", r.total_amount, r.deposit, r.status])} />
          <DataTable title="Purchases (Expenses)" columns={["Date","ID","Total","Tax","Status"]} rows={(data.expenses?.rows||[]).map((r:any)=>[r.purchase_date||"", r.id, r.total_amount, r.tax_amount, r.payment_status||"—"]) } />
          <DataTable title="Company Expenses" columns={["Date","Category","Description","Vendor","Method","Amount"]} rows={(data.expenses?.company_rows||[]).map((r:any)=>[r.expense_date||"", r.category||"—", r.description||"—", r.vendor||"—", r.payment_method||"—", r.amount])} />
        </div>
      )}
    </div>
  );
}

function SummaryCard({ data }: { data: any }) {
  const income = Number(data.totals?.income || 0);
  const expenses = Number(data.totals?.expenses || 0);
  const profit = Number(data.totals?.profit || 0);
  const profitPositive = profit >= 0;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-3">
          <KPI title="Income" value={`₹${income.toLocaleString()}`} positive />
          <KPI title="Expenses" value={`₹${expenses.toLocaleString()}`} />
          <KPI title="Profit" value={`₹${profit.toLocaleString()}`} positive={profitPositive} />
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-3 text-sm">
          <div>Donations: ₹{Number(data.donations?.total || 0).toLocaleString()}</div>
          <div>Rent: ₹{Number(data.rent?.total || 0).toLocaleString()}</div>
          <div>Membership Fees: ₹{Number(data.membership_fees?.total || 0).toLocaleString()}</div>
          <div>Inventory Rentals: ₹{Number(data.inventory_rentals?.total || 0).toLocaleString()}</div>
          <div>Purchases: ₹{Number(data.expenses?.purchases || 0).toLocaleString()}</div>
          <div>Company Expenses: ₹{Number(data.expenses?.company_expenses || 0).toLocaleString()}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function KPI({ title, value, positive }: { title: string; value: string; positive?: boolean }) {
  return (
    <div className="rounded-lg border p-3 bg-card flex items-center justify-between">
      <div>
        <div className="text-xs text-muted-foreground">{title}</div>
        <div className="text-xl font-semibold">{value}</div>
      </div>
      {positive !== undefined && (
        positive ? <TrendingUp className="h-5 w-5 text-success" /> : <TrendingDown className="h-5 w-5 text-error" />
      )}
    </div>
  );
}

function DataTable({ title, columns, rows }: { title: string; columns: string[]; rows: any[][] }) {
  return (
    <div className="rounded border overflow-x-auto">
      <div className="p-3 font-medium bg-muted/40">{title}</div>
      <table className="min-w-full text-sm">
        <thead>
          <tr className="bg-muted text-left">
            {columns.map((c) => (
              <th key={c} className="p-2">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, idx) => (
            <tr key={idx} className="border-t">
              {r.map((cell, cidx) => (
                <td key={cidx} className="p-2">{typeof cell === 'number' ? `₹${Number(cell).toLocaleString()}` : String(cell ?? "")}</td>
              ))}
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td className="p-3" colSpan={columns.length}>No data</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}


