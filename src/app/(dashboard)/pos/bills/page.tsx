"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table } from "@/components/ui/table";
import { SalesBill, BillItem } from "@/lib/types/sales";
import { 
  Download, 
  Eye, 
  ArrowLeft, 
  Search, 
  Filter, 
  Calendar, 
  Trash2, 
  Receipt,
  TrendingUp,
  DollarSign,
  Users,
  Clock,
  X,
  BarChart3,
  FileText,
  Printer,
  Share2,
  MoreHorizontal,
  CreditCard,
  Banknote,
  Smartphone,
  MoreHorizontal as MoreHorizontalIcon,
  Calculator
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { format } from "date-fns";

export default function SalesBillsPage() {
  const [bills, setBills] = useState<SalesBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedBill, setSelectedBill] = useState<SalesBill | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showStats, setShowStats] = useState(true);
  const [sortBy, setSortBy] = useState<"date" | "amount" | "customer">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    fetchBills();
  }, []);

  async function fetchBills() {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append("customer_name", searchTerm);
      if (selectedPaymentMethod) params.append("payment_method", selectedPaymentMethod);
      if (fromDate) params.append("from_date", fromDate);
      if (toDate) params.append("to_date", toDate);

      const response = await fetch(`/api/sales/bills?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setBills(data.bills || []);
      } else {
        toast.error("Failed to fetch bills");
      }
    } catch (error) {
      console.error("Error fetching bills:", error);
      toast.error("Error loading bills");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (!loading) {
        fetchBills();
      }
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm, selectedPaymentMethod, fromDate, toDate]);

  async function handleDelete(billId: string) {
    try {
      const response = await fetch(`/api/sales/bills/${billId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Bill deleted successfully!");
        fetchBills();
      } else {
        toast.error("Failed to delete bill");
      }
    } catch (error) {
      console.error("Error deleting bill:", error);
      toast.error("Error deleting bill");
    }
  }

  async function downloadPDF(billId: string, billNumber: string) {
    try {
      const response = await fetch(`/api/sales/bills/${billId}/pdf`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `invoice-${billNumber}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success("PDF downloaded successfully!");
      } else {
        toast.error("Failed to download PDF");
      }
    } catch (error) {
      console.error("Error downloading PDF:", error);
      toast.error("Error downloading PDF");
    }
  }

  function clearFilters() {
    setSearchTerm("");
    setSelectedPaymentMethod("");
    setFromDate("");
    setToDate("");
  }

  function getPaymentMethodIcon(method: string) {
    switch (method) {
      case "cash": return <Banknote className="h-4 w-4" />;
      case "card": return <CreditCard className="h-4 w-4" />;
      case "upi": return <Smartphone className="h-4 w-4" />;
      default: return <MoreHorizontalIcon className="h-4 w-4" />;
    }
  }

  function getPaymentMethodColor(method: string) {
    switch (method) {
      case "cash": return "bg-green-500/10 text-green-500 border-green-500/20";
      case "card": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "upi": return "bg-purple-500/10 text-purple-500 border-purple-500/20";
      default: return "bg-muted text-muted-foreground border-border";
    }
  }

  // Sort bills
  const sortedBills = [...bills].sort((a, b) => {
    let aValue: any, bValue: any;
    
    switch (sortBy) {
      case "date":
        aValue = new Date(a.created_at);
        bValue = new Date(b.created_at);
        break;
      case "amount":
        aValue = Number(a.total_amount);
        bValue = Number(b.total_amount);
        break;
      case "customer":
        aValue = a.customer_name || "";
        bValue = b.customer_name || "";
        break;
      default:
        return 0;
    }

    if (sortOrder === "asc") {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const totalRevenue = bills.reduce((sum, bill) => sum + Number(bill.total_amount), 0);
  const totalBills = bills.length;
  const averageBill = totalBills > 0 ? totalRevenue / totalBills : 0;
  const todayBills = bills.filter(bill => {
    const billDate = new Date(bill.created_at).toDateString();
    const today = new Date().toDateString();
    return billDate === today;
  }).length;
  const todayRevenue = bills.filter(bill => {
    const billDate = new Date(bill.created_at).toDateString();
    const today = new Date().toDateString();
    return billDate === today;
  }).reduce((sum, bill) => sum + Number(bill.total_amount), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading bills...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="bg-card border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/pos">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to POS
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Sales Bills</h1>
                <p className="text-muted-foreground">View and manage all sales transactions</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowStats(!showStats)}
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                {showStats ? "Hide" : "Show"} Stats
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        

        {/* Filters */}
        {showFilters && (
          <Card className="p-4 mb-6 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <Label htmlFor="search" className="text-sm font-medium text-muted-foreground mb-1 block">Customer Name</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search by customer name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="paymentMethod" className="text-sm font-medium text-muted-foreground mb-1 block">Payment Method</Label>
                <select
                  id="paymentMethod"
                  className="w-full px-3 py-2 border border-border rounded-md text-sm bg-background"
                  value={selectedPaymentMethod}
                  onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                >
                  <option value="">All Methods</option>
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="upi">UPI</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <Label htmlFor="fromDate" className="text-sm font-medium text-muted-foreground mb-1 block">From Date</Label>
                <Input
                  id="fromDate"
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="text-sm"
                />
              </div>
              <div>
                <Label htmlFor="toDate" className="text-sm font-medium text-muted-foreground mb-1 block">To Date</Label>
                <Input
                  id="toDate"
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="text-sm"
                />
              </div>
              <div className="flex items-end">
                <Button variant="outline" onClick={clearFilters} className="w-full">
                  <X className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Sort Controls */}
        <Card className="p-4 mb-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-muted-foreground">Sort by:</span>
              <select
                className="px-3 py-2 border border-border rounded-md text-sm bg-background"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
              >
                <option value="date">Date</option>
                <option value="amount">Amount</option>
                <option value="customer">Customer</option>
              </select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                className="px-3"
              >
                {sortOrder === "asc" ? "↑" : "↓"} {sortOrder === "asc" ? "Ascending" : "Descending"}
              </Button>
            </div>
            <div className="text-sm text-muted-foreground">
              Showing {sortedBills.length} of {bills.length} bills
            </div>
          </div>
        </Card>

        {/* Bills Table */}
        <Card className="p-6 shadow-sm">
          {sortedBills.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground mb-2">
                No bills found. Create your first sale to get started.
              </p>
              <Link href="/pos">
                <Button className="mt-2">
                  <Receipt className="h-4 w-4 mr-2" />
                  Create First Sale
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Bill Number</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Customer</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Date & Time</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Items</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Payment Method</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Total Amount</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedBills.map(bill => (
                    <tr key={bill.id} className="border-b border-border/50 hover:bg-muted transition-colors">
                      <td className="py-4 px-4">
                        <div className="font-mono font-semibold text-primary">{bill.bill_number}</div>
                      </td>
                      <td className="py-4 px-4">
                        {bill.customer_name ? (
                          <div>
                            <div className="font-medium text-foreground">{bill.customer_name}</div>
                            {bill.customer_phone && (
                              <div className="text-sm text-muted-foreground">
                                {bill.customer_phone}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground italic">Walk-in Customer</span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-sm text-foreground">
                          {format(new Date(bill.created_at), "dd/MM/yyyy")}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(bill.created_at), "HH:mm")}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-sm text-foreground">
                          {bill.items.length} item{bill.items.length !== 1 ? "s" : ""}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Qty: {bill.items.reduce((sum, item) => sum + item.quantity, 0)}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <Badge 
                          variant="outline" 
                          className={`${getPaymentMethodColor(bill.payment_method)} border`}
                        >
                          <div className="flex items-center gap-1">
                            {getPaymentMethodIcon(bill.payment_method)}
                            <span className="capitalize">{bill.payment_method}</span>
                          </div>
                        </Badge>
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-semibold text-foreground text-lg">
                          ₹{Number(bill.total_amount).toFixed(2)}
                        </div>
                        {Number(bill.discount_amount) > 0 && (
                          <div className="text-xs text-green-500">
                            -₹{Number(bill.discount_amount).toFixed(2)} discount
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedBill(bill)}
                            title="View Details"
                            className="h-8 w-8 p-0"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => downloadPDF(bill.id, bill.bill_number)}
                            title="Download PDF"
                            className="h-8 w-8 p-0"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete Bill ${bill.bill_number}?`)) {
                                handleDelete(bill.id);
                              }
                            }}
                            title="Delete Bill"
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card>
      </div>

      {/* Bill Details Modal */}
      {selectedBill && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Receipt className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-semibold text-foreground">Bill Details</h2>
                <Badge variant="outline" className="text-lg px-3 py-1">
                  #{selectedBill.bill_number}
                </Badge>
              </div>
              <Button
                variant="ghost"
                onClick={() => setSelectedBill(null)}
                className="h-8 w-8 p-0"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="space-y-6">
              {/* Header Info */}
              <div className="grid grid-cols-2 gap-6 p-4 bg-muted/50 rounded-lg">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Bill Date</Label>
                  <div className="text-foreground font-medium">
                    {format(new Date(selectedBill.created_at), "dd/MM/yyyy HH:mm")}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Payment Method</Label>
                  <Badge 
                    variant="outline" 
                    className={`${getPaymentMethodColor(selectedBill.payment_method)} border mt-1`}
                  >
                    <div className="flex items-center gap-1">
                      {getPaymentMethodIcon(selectedBill.payment_method)}
                      <span className="capitalize">{selectedBill.payment_method}</span>
                    </div>
                  </Badge>
                </div>
              </div>

              {/* Customer Info */}
              {selectedBill.customer_name && (
                <div className="p-4 bg-primary/5 rounded-lg">
                  <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    Customer Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Name</Label>
                      <div className="text-foreground font-medium">{selectedBill.customer_name}</div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Phone</Label>
                      <div className="text-foreground">{selectedBill.customer_phone || "-"}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Items Table */}
              <div>
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-green-500" />
                  Items ({selectedBill.items.length})
                </h3>
                <div className="border border-border rounded-lg overflow-hidden">
                  <Table>
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Item</th>
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Price</th>
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Qty</th>
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedBill.items.map((item: BillItem, index: number) => (
                        <tr key={index} className="border-b border-border/50">
                          <td className="py-3 px-4">
                            <div className="font-medium text-foreground">{item.item_name}</div>
                            {item.category && (
                              <Badge variant="secondary" className="text-xs mt-1">
                                {item.category}
                              </Badge>
                            )}
                          </td>
                          <td className="py-3 px-4 font-mono text-foreground">₹{item.price.toFixed(2)}</td>
                          <td className="py-3 px-4 text-foreground">{item.quantity}</td>
                          <td className="py-3 px-4 font-mono font-semibold text-foreground">₹{item.total.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </div>

              {/* Summary */}
              <div className="p-4 bg-muted/50 rounded-lg">
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-purple-500" />
                  Bill Summary
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span className="font-medium text-foreground">₹{Number(selectedBill.subtotal).toFixed(2)}</span>
                  </div>
                  {Number(selectedBill.discount_amount) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Discount:</span>
                      <span className="font-medium text-green-500">-₹{Number(selectedBill.discount_amount).toFixed(2)}</span>
                    </div>
                  )}
                  {Number(selectedBill.tax_amount) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tax:</span>
                      <span className="font-medium text-foreground">₹{Number(selectedBill.tax_amount).toFixed(2)}</span>
                    </div>
                  )}
                  <hr className="border-border my-2" />
                  <div className="flex justify-between text-lg font-bold text-foreground">
                    <span>Total:</span>
                    <span className="text-2xl">₹{Number(selectedBill.total_amount).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedBill.notes && (
                <div className="p-4 bg-yellow-500/5 rounded-lg">
                  <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-yellow-500" />
                    Notes
                  </h3>
                  <div className="text-muted-foreground bg-card p-3 rounded border">
                    {selectedBill.notes}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-border">
                <Button
                  onClick={() => downloadPDF(selectedBill.id, selectedBill.bill_number)}
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.print()}
                  className="flex-1"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setSelectedBill(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
