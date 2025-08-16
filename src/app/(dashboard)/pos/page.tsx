"use client";

import { useState, useEffect, useMemo } from "react";
import { SalesItem, BillItem, CreateSalesBillRequest } from "@/lib/types/sales";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
import { 
  ShoppingCart, 
  User, 
  CreditCard, 
  Receipt, 
  Plus, 
  Minus, 
  Trash2, 
  Search, 
  Filter, 
  Tag,
  Package,
  DollarSign,
  TrendingUp,
  Users,
  Clock
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";



export default function POSPage() {
  const [items, setItems] = useState<SalesItem[]>([]);
  // Removed categories state
  const [cart, setCart] = useState<BillItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "upi" | "other" | "membership">("cash");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState("");
  const [itemPrice, setItemPrice] = useState("");
  const [itemQuantity, setItemQuantity] = useState(1);
  // Removed selectedCategory state
  const [searchTerm, setSearchTerm] = useState("");
  
  
  useEffect(() => {
    async function fetchData() {
      try {
        const itemsResponse = await fetch("/api/sales/items?is_active=true");
        if (itemsResponse.ok) {
          const itemsData = await itemsResponse.json();
          setItems(itemsData.items || []);
        } else {
          toast.error("Failed to fetch items");
        }
      } catch (error) {
        toast.error("Error loading data");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);
  
  // Auto-populate price when item is selected
  useEffect(() => {
    if (selectedItemId) {
      const selectedItem = items.find(item => item.id === selectedItemId);
      if (selectedItem) {
        // Use a default price from item if available, or set to empty for manual input
        // For now, we'll keep it manual but you could set a default price here
        setItemPrice("");
      }
    } else {
      setItemPrice("");
    }
  }, [selectedItemId, items]);
  
  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + (item.price * item.quantity), 0), [cart]);
  const total = subtotal;
  
  function addToCart() {
    const item = items.find(i => i.id === selectedItemId);
    const price = Number(itemPrice);
    const quantity = itemQuantity;
    
    if (!item) {
      toast.error("Please select an item");
      return;
    }
    
    if (price <= 0) {
      toast.error("Please enter a valid price");
      return;
    }
    
    if (quantity <= 0) {
      toast.error("Please enter a valid quantity");
      return;
    }
    
    setCart([...cart, {
      item_id: item.id,
      item_name: item.name,
      price,
      quantity,
      total: price * quantity
    }]);
    
    // Reset form
    setSelectedItemId("");
    setItemPrice("");
    setItemQuantity(1);
  }
  
  
  
  function removeFromCart(idx: number) {
    setCart(cart.filter((_, i) => i !== idx));
  }
  
  function clearCart() {
    setCart([]);
    setCustomerName("");
    setCustomerPhone("");
    setPaymentMethod("cash");
    setNotes("");
  // Removed setSelectedCategory
    setSearchTerm("");
  }
  
  // Phone number validation
  function isValidPhone(phone: string) {
    if (!phone) return true; // Phone is optional
    const phoneRegex = /^[0-9]{10}$/;
    return phoneRegex.test(phone);
  }
  
  async function createBill() {
    if (cart.length === 0) {
      toast.error("Add items to cart");
      return;
    }
    
    if (customerPhone && !isValidPhone(customerPhone)) {
      toast.error("Please enter a valid 10-digit phone number");
      return;
    }
    
    setProcessing(true);
    try {
      const billData: CreateSalesBillRequest = {
        customer_name: customerName || undefined,
        customer_phone: customerPhone || undefined,
        items: cart,
        subtotal,
        tax_amount: 0,
        discount_amount: 0,
        total_amount: total,
        payment_method: paymentMethod,
        notes: notes || undefined,
      };
      const response = await fetch("/api/sales/bills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(billData),
      });
      if (response.ok) {
        toast.success("Bill created successfully!");
        clearCart();
      } else {
        toast.error("Failed to create bill");
      }
    } catch {
      toast.error("Error creating bill");
    } finally {
      setProcessing(false);
    }
  }
  
  // Filter items based on search only
  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading POS system...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-6">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header (without Available Items stat) */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Point of Sale
              </h1>
              <p className="text-muted-foreground mt-2">Create sales bills and manage transactions</p>
            </div>
            <div className="flex gap-3">
              <Link href="/pos/items">
                <Button variant="outline" className="bg-card hover:bg-muted">
                  <Package className="h-4 w-4 mr-2" />
                  Manage Items
                </Button>
              </Link>
              {/* Removed Categories button */}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Add Item Form (only item and price) */}
            <Card className="p-6 shadow-sm bg-card">
              <h2 className="text-xl font-semibold text-card-foreground mb-4">Add to Cart</h2>
              <div className="grid grid-cols-1 md:grid-cols-8 gap-4 items-end">
                <div className="md:col-span-4">
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Item</label>
                  <Select value={selectedItemId} onValueChange={setSelectedItemId}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select item" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Select item</SelectItem>
                      {items.map(item => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Price (₹)</label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={itemPrice}
                    onChange={e => setItemPrice(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div className="md:col-span-2">
                  <Button 
                    onClick={addToCart} 
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
                    disabled={!selectedItemId || !itemPrice}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </div>
              </div>
            </Card>
            <Card className="p-6 shadow-sm bg-card">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-card-foreground flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  Shopping Cart
                </h2>
                <Button
                  variant="outline"
                  onClick={clearCart}
                  disabled={cart.length === 0}
                  className="text-muted-foreground hover:bg-red-500/10 hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear Cart
                </Button>
              </div>
              {cart.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <ShoppingCart className="h-16 w-16 mx-auto mb-4 text-gray-300 dark:text-gray-700" />
                  <p className="text-lg font-medium mb-2">Your cart is empty</p>
                  <p className="text-sm">Add items from above to create a bill</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 border rounded-lg bg-gradient-to-r from-card to-muted/50 hover:shadow-sm transition-all">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/50 dark:to-pink-900/50 rounded-lg flex items-center justify-center">
                          <Package className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-card-foreground">{item.item_name}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground">Qty: {item.quantity}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-card-foreground">₹{item.total.toFixed(2)}</div>
                        <div className="text-sm text-muted-foreground">₹{item.price.toFixed(2)} each</div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFromCart(idx)}
                        className="text-red-500 hover:text-red-500 hover:bg-red-500/10 ml-2"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
          <div className="space-y-6">
            <Card className="p-6 shadow-sm bg-card">
              <h2 className="text-xl font-semibold text-card-foreground mb-4 flex items-center gap-2">
                <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                Customer Details
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Customer Name</label>
                  <Input
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    placeholder="Enter customer name"
                    className="focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Phone Number</label>
                  <Input
                    value={customerPhone}
                    onChange={e => setCustomerPhone(e.target.value)}
                    placeholder="10-digit phone number"
                    maxLength={10}
                    className="focus:ring-2 focus:ring-blue-500"
                  />
                  {customerPhone && !isValidPhone(customerPhone) && (
                    <p className="text-sm text-red-600 mt-1">Please enter a valid 10-digit phone number</p>
                  )}
                </div>
              </div>
            </Card>
            
            <Card className="p-6 shadow-sm bg-card">
              <h2 className="text-xl font-semibold text-card-foreground mb-4 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-green-600 dark:text-green-400" />
                Payment Details
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Payment Method</label>
                  <Select value={paymentMethod} onValueChange={val => setPaymentMethod(val as "cash" | "card" | "upi" | "other" | "membership")}> 
                    <SelectTrigger className="focus:ring-2 focus:ring-green-500">
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          Cash
                        </div>
                      </SelectItem>
                      <SelectItem value="card">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                          Card
                        </div>
                      </SelectItem>
                      <SelectItem value="upi">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                          UPI
                        </div>
                      </SelectItem>
                      <SelectItem value="other">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                          Other
                        </div>
                      </SelectItem>
                      <SelectItem value="membership">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                          Membership
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Notes</label>
                  <Textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    rows={3}
                    placeholder="Additional notes (optional)"
                    className="focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
            </Card>
            
            <Card className="p-6 shadow-sm bg-card border-2 border-orange-200 dark:border-orange-800 bg-gradient-to-br from-orange-50 to-white dark:from-orange-900/20 dark:to-card">
              <h2 className="text-xl font-semibold text-card-foreground mb-4 flex items-center gap-2">
                <Receipt className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                Bill Summary
              </h2>
              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg border">
                  <span className="text-muted-foreground font-medium">Subtotal</span>
                  <span className="font-semibold text-card-foreground">₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gradient-to-r from-orange-100 to-orange-200 dark:from-orange-800/50 dark:to-orange-700/50 rounded-lg border border-orange-200 dark:border-orange-700">
                  <span className="text-orange-900 dark:text-orange-200 font-bold text-lg">Total Amount</span>
                  <span className="font-bold text-orange-600 dark:text-orange-400 text-xl">₹{total.toFixed(2)}</span>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <Button
                  onClick={createBill}
                  disabled={processing || cart.length === 0}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white py-4 text-lg font-semibold shadow-lg"
                >
                  {processing ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      Processing Bill...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <Receipt className="h-5 w-5 mr-2" />
                      Create Bill - ₹{total.toFixed(2)}
                    </div>
                  )}
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
