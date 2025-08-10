import { createSupabaseServerClient } from "@/lib/supabase/server";
import Link from "next/link";
import { StatCard } from "@/components/ui/stat-card";
import { Chart, LineChart } from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, AlertTriangle, HandCoins, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type MonthlyPoint = { label: string; value: number };

async function fetchDashboardData() {
  const supabase = await createSupabaseServerClient();

  try {
    const [
      { count: memberCount },
      { count: activeMembers },
      { count: pendingFees },
      itemsRes,
      donationsRes,
      rentRes,
      feeRes,
      invRentalsRes,
      membersRecentRes,
      donationsRecentRes,
      expensesRecentRes,
      feePaymentsRecentRes,
    ] = await Promise.all([
      supabase.from("members").select("id", { count: "exact", head: true }),
      supabase.from("members").select("id", { count: "exact", head: true }).eq("is_active", true),
      supabase.from("fee_payments").select("id", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("inventory_items").select("id, stock_levels").limit(1000),
      (() => {
        const start = new Date();
        start.setMonth(start.getMonth() - 5, 1);
        start.setHours(0, 0, 0, 0);
        return supabase.from("donations").select("amount, donation_date").gte("donation_date", start.toISOString());
      })(),
      (() => {
        const start = new Date();
        start.setMonth(start.getMonth() - 5, 1);
        start.setHours(0, 0, 0, 0);
        return supabase.from("rent_payments").select("amount_paid, payment_month").gte("payment_month", start.toISOString());
      })(),
      (() => {
        const start = new Date();
        start.setMonth(start.getMonth() - 5, 1);
        start.setHours(0, 0, 0, 0);
        return supabase.from("fee_payments").select("amount, payment_date").gte("payment_date", start.toISOString());
      })(),
      (() => {
        const start = new Date();
        start.setMonth(start.getMonth() - 5, 1);
        start.setHours(0, 0, 0, 0);
        return supabase.from("inventory_rentals").select("total_amount, created_at").gte("created_at", start.toISOString());
      })(),
      supabase.from("members").select("id, member_code, created_at, is_active").order("created_at", { ascending: false }).limit(5),
      supabase.from("donations").select("id, donor_name, amount, donation_date").order("donation_date", { ascending: false }).limit(5),
      supabase.from("company_expenses").select("id, category, amount, expense_date, vendor").order("expense_date", { ascending: false }).limit(5),
      supabase.from("fee_payments").select("id, amount, payment_date, payment_method, receipt_number, status").order("payment_date", { ascending: false }).limit(5),
    ]);

    const items = (itemsRes.data || []) as Array<{ id: string; stock_levels: any }>;
    const lowStockCount = items.reduce((acc, it) => {
      const current = Number(it.stock_levels?.current ?? 0);
      const min = Number(it.stock_levels?.min ?? 0);
      return acc + (min > 0 && current <= min ? 1 : 0);
    }, 0);

    const labels: string[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      labels.push(`${d.toLocaleString("en", { month: "short" })} ${d.getFullYear()}`);
    }

    function toMonthKey(dateLike: string | Date | null | undefined) {
      if (!dateLike) return "";
      const d = typeof dateLike === "string" ? new Date(dateLike) : dateLike;
      if (Number.isNaN(d.getTime())) return "";
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    }

    const monthKeys = labels.map((l) => {
      const [mon, year] = l.split(" ");
      const monthIndex = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].indexOf(mon);
      return `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
    });

    const totalsByMonth: Record<string, number> = Object.fromEntries(monthKeys.map((k) => [k, 0]));
    (donationsRes.data || []).forEach((r: any) => {
      const k = toMonthKey(r.donation_date);
      if (k in totalsByMonth) totalsByMonth[k] += Number(r.amount || 0);
    });
    (rentRes.data || []).forEach((r: any) => {
      const k = toMonthKey(r.payment_month);
      if (k in totalsByMonth) totalsByMonth[k] += Number(r.amount_paid || 0);
    });
    (feeRes.data || []).forEach((r: any) => {
      const k = toMonthKey(r.payment_date);
      if (k in totalsByMonth) totalsByMonth[k] += Number(r.amount || 0);
    });
    (invRentalsRes.data || []).forEach((r: any) => {
      const k = toMonthKey(r.created_at);
      if (k in totalsByMonth) totalsByMonth[k] += Number(r.total_amount || 0);
    });

    const monthlyRevenue: MonthlyPoint[] = monthKeys.map((k, idx) => ({
      label: labels[idx].split(" ")[0],
      value: totalsByMonth[k] || 0,
    }));

    const last = monthlyRevenue[monthlyRevenue.length - 1]?.value || 0;
    const prev = monthlyRevenue[monthlyRevenue.length - 2]?.value || 0;
    const paymentTrend = prev === 0 ? (last > 0 ? 100 : 0) : Math.round(((last - prev) / prev) * 100);
    const memberTrend = 0;
    const stockTrend = 0;

    return {
      stats: {
        memberCount: memberCount ?? 0,
        activeMembers: activeMembers ?? 0,
        pendingFees: pendingFees ?? 0,
        lowStockCount,
        incomeThisMonth: last,
      },
      trends: {
        memberTrend,
        paymentTrend,
        stockTrend,
      },
      chartData: {
        monthlyRevenue,
        memberDistribution: [
          { label: "Active", value: activeMembers ?? 0, color: "hsl(142, 76%, 36%)" },
          { label: "Inactive", value: (memberCount ?? 0) - (activeMembers ?? 0), color: "hsl(48, 96%, 53%)" },
          { label: "Pending Fees", value: pendingFees ?? 0, color: "hsl(217, 91%, 60%)" },
        ],
      },
      tables: {
        recentMembers: membersRecentRes.data || [],
        recentDonations: donationsRecentRes.data || [],
        recentExpenses: expensesRecentRes.data || [],
        recentFeePayments: feePaymentsRecentRes.data || [],
      },
    };
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return {
      stats: { memberCount: 0, activeMembers: 0, pendingFees: 0, lowStockCount: 0, incomeThisMonth: 0 },
      trends: { memberTrend: 0, paymentTrend: 0, stockTrend: 0 },
      chartData: { monthlyRevenue: [], memberDistribution: [] },
      tables: { recentMembers: [], recentDonations: [], recentExpenses: [], recentFeePayments: [] },
    };
  }
}

export default async function DashboardHome() {
  const { stats, trends, chartData, tables } = await fetchDashboardData();

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Key insights and recent activity</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Members"
          value={stats.memberCount.toLocaleString()}
          trend={{ value: trends.memberTrend, isPositive: trends.memberTrend > 0, period: "vs last month" }}
          icon={Users}
          variant="success"
          description="All registered members"
        />

        <StatCard
          title="Active Members"
          value={stats.activeMembers.toLocaleString()}
          trend={{ value: trends.paymentTrend, isPositive: trends.paymentTrend > 0, period: "vs last month" }}
          icon={Users}
          variant="info"
          description="Currently active"
        />

        <StatCard
          title="Pending Fees"
          value={stats.pendingFees.toLocaleString()}
          trend={{ value: trends.paymentTrend, isPositive: trends.paymentTrend > 0, period: "vs last month" }}
          icon={HandCoins}
          variant="warning"
          description="Outstanding payments"
        />

        <StatCard
          title="Income (This Month)"
          value={`₹${Math.round(stats.incomeThisMonth).toLocaleString()}`}
          icon={DollarSign}
          variant="success"
          description="Donations, fees, rent, rentals"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <LineChart title="Monthly Revenue (last 6 months)" data={chartData.monthlyRevenue} height={300} />
        <Chart title="Member Distribution" data={chartData.memberDistribution} height={200} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex items-center justify-between flex-row">
            <CardTitle>Recent Members</CardTitle>
            <Link href="/members" className="text-sm text-primary">View all</Link>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member Code</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(tables.recentMembers || []).map((m: any) => (
                  <TableRow key={m.id}>
                    <TableCell>
                      <Link href={`/members/${m.id}`} className="text-primary hover:underline">{m.member_code || m.id.slice(0, 8)}</Link>
                    </TableCell>
                    <TableCell>{m.is_active ? "Active" : "Inactive"}</TableCell>
                    <TableCell>{new Date(m.created_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex items-center justify-between flex-row">
            <CardTitle>Recent Donations</CardTitle>
            <Link href="/donations" className="text-sm text-primary">View all</Link>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Donor</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(tables.recentDonations || []).map((d: any) => (
                  <TableRow key={d.id}>
                    <TableCell>{d.donor_name || "Anonymous"}</TableCell>
                    <TableCell>₹{Number(d.amount || 0).toLocaleString()}</TableCell>
                    <TableCell>{d.donation_date ? new Date(d.donation_date).toLocaleDateString() : "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex items-center justify-between flex-row">
            <CardTitle>Recent Expenses</CardTitle>
            <Link href="/expenses" className="text-sm text-primary">View all</Link>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(tables.recentExpenses || []).map((e: any) => (
                  <TableRow key={e.id}>
                    <TableCell>{e.category || e.vendor || "Expense"}</TableCell>
                    <TableCell>₹{Number(e.amount || 0).toLocaleString()}</TableCell>
                    <TableCell>{e.expense_date ? new Date(e.expense_date).toLocaleDateString() : "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex items-center justify-between flex-row">
            <CardTitle>Recent Fee Payments</CardTitle>
            <Link href="/membership/payments" className="text-sm text-primary">View all</Link>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Receipt</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(tables.recentFeePayments || []).map((p: any) => (
                  <TableRow key={p.id}>
                    <TableCell>{p.receipt_number || p.id.slice(0, 8)}</TableCell>
                    <TableCell>₹{Number(p.amount || 0).toLocaleString()}</TableCell>
                    <TableCell>{p.status || "paid"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
