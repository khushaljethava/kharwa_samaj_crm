"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MinusCircle, PlusCircle } from "lucide-react";
import { handleStockErrors, showStockSuccess, type StockErrorResponse } from "@/lib/utils/stock-errors";

type MemberLite = { id: string; name: string };
type ItemLite = { 
  id: string; 
  name: string;
  item_details?: { name?: string } | null;
  sku?: string;
  stock_levels?: { current?: number; min?: number } | null;
};
type PersonalInfo = { first_name?: string; middle_name?: string; last_name?: string };
type ApiMember = { id: string; personal_info: PersonalInfo | null; member_code: string | null };

export default function NewInventoryRentalPage() {
  const router = useRouter();
  const [members, setMembers] = useState<MemberLite[]>([]);
  const [items, setItems] = useState<ItemLite[]>([]);
  const [lines, setLines] = useState<Array<{ item_id: string; quantity: number; unit_rate: number }>>([
    { item_id: "", quantity: 1, unit_rate: 0 },
  ]);
  
  // Create a map for quick item lookup
  const itemsMap = useMemo(() => {
    const map = new Map<string, { name: string; sku?: string }>();
    items.forEach(item => {
      map.set(item.id, { 
        name: item.name, 
        sku: item.sku 
      });
    });
    return map;
  }, [items]);
  const [memberId, setMemberId] = useState<string>("");
  const [deposit, setDeposit] = useState<number>(0);
  
  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];
  const [dueDate, setDueDate] = useState<string>(today);
  const [notes, setNotes] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const [mRes, iRes] = await Promise.all([
        fetch("/api/members?limit=100"),
        fetch("/api/inventory/items?limit=200"),
      ]);
      const m = await mRes.json().catch(() => ({}));
      const i = await iRes.json().catch(() => ({}));
      setMembers((m?.data || []).map((r: ApiMember) => ({
        id: r.id,
        name: displayName(r.personal_info, r.member_code, r.id),
      })));
      setItems((i?.data || []).map((it: any) => ({
        id: it.id,
        name: it.item_details?.name || it.sku || it.id,
        sku: it.sku,
        stock_levels: it.stock_levels,
      })));
    }
    load();
  }, []);

  const totalAmount = useMemo(() => {
    return lines.reduce((sum, l) => sum + (l.quantity || 0) * (l.unit_rate || 0), 0);
  }, [lines]);

  function updateLine(index: number, patch: Partial<{ item_id: string; quantity: number; unit_rate: number }>) {
    setLines((prev) => prev.map((l, i) => (i === index ? { ...l, ...patch } : l)));
    
    // Check stock availability if quantity is being updated
    if (patch.quantity) {
      const line = lines[index];
      const itemId = patch.item_id || line.item_id;
      const item = items.find(it => it.id === itemId);
      const available = item?.stock_levels?.current || 0;
      
      if (patch.quantity > available && available > 0) {
        const itemName = item?.name || 'Selected item';
        toast.error(`⚠️ ${itemName}: Only ${available} units available (requesting ${patch.quantity})`, {
          duration: 4000,
          icon: '⚠️',
        });
      }
    }
  }

  function addLine() {
    setLines((prev) => [...prev, { item_id: "", quantity: 1, unit_rate: 0 }]);
  }

  function removeLine(index: number) {
    setLines((prev) => prev.filter((_, i) => i !== index));
  }

  async function onSubmit() {
    setLoading(true);
    setError(null);
    
    const body = {
      member_id: memberId,
      items: lines,
      deposit,
      total_amount: totalAmount,
      due_date: dueDate || undefined,
      notes: notes || undefined,
    };
    
    try {
      const res = await fetch("/api/rentals", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      
      setLoading(false);
      
      if (res.ok) {
        showStockSuccess("Rental created successfully!");
        router.push("/inventory/rentals");
        return;
      }
      
      const errorData = await res.json().catch(() => ({}));
      
      // Handle stock-specific errors
      if (res.status === 400 && errorData?.error && typeof errorData.error === 'object') {
        const stockError = errorData.error as StockErrorResponse;
        if (stockError.message?.includes("Insufficient stock") && stockError.details) {
          handleStockErrors(stockError, itemsMap);
          return;
        }
      }
      
      // Handle other errors
      const errorMessage = typeof errorData?.error === 'string' 
        ? errorData.error 
        : errorData?.error?.message 
        || "Failed to create rental";
      
      setError(errorMessage);
      toast.error(errorMessage);
      
    } catch (err) {
      setLoading(false);
      const errorMessage = "Network error. Please try again.";
      setError(errorMessage);
      toast.error(errorMessage);
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-xl font-semibold">New Inventory Rental</h1>
      <div className="space-y-4">
        <div>
          <Label>Member</Label>
          <Select value={memberId} onValueChange={(v) => setMemberId(v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select member" />
            </SelectTrigger>
            <SelectContent>
              {members.map((m) => (
                <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Items</Label>
            <Button variant="outline" size="sm" onClick={addLine}><PlusCircle className="h-4 w-4 mr-2" /> Add Item</Button>
          </div>
          {lines.map((line, idx) => (
            <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-2 items-end">
              <div className="md:col-span-2">
                <Label>Item</Label>
                <Select value={line.item_id} onValueChange={(v) => updateLine(idx, { item_id: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select item" />
                  </SelectTrigger>
                  <SelectContent>
                    {items.map((it) => {
                      const stock = it.stock_levels?.current || 0;
                      const stockText = stock > 0 ? ` (${stock} available)` : ' (Out of stock)';
                      const isOutOfStock = stock === 0;
                      
                      return (
                        <SelectItem 
                          key={it.id} 
                          value={it.id}
                          disabled={isOutOfStock}
                          className={isOutOfStock ? 'text-red-500 opacity-50' : ''}
                        >
                          {it.name}{stockText}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Qty</Label>
                {(() => {
                  const item = items.find(it => it.id === line.item_id);
                  const maxStock = item?.stock_levels?.current || 999;
                  const isOverStock = line.quantity > maxStock;
                  
                  return (
                    <div className="relative">
                      <Input 
                        type="number" 
                        min={1} 
                        max={maxStock}
                        value={line.quantity} 
                        onChange={(e) => updateLine(idx, { quantity: Number(e.target.value) })}
                        className={isOverStock ? 'border-red-500 bg-red-50' : ''}
                      />
                      {isOverStock && maxStock < 999 && (
                        <div className="text-xs text-red-600 mt-1">
                          Max available: {maxStock}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
              <div>
                <Label>Unit Rate</Label>
                <Input type="number" min={0} step={0.01} value={line.unit_rate} onChange={(e) => updateLine(idx, { unit_rate: Number(e.target.value) })} />
              </div>
              <div className="flex justify-end md:col-span-4">
                <Button type="button" variant="destructive" size="icon" onClick={() => removeLine(idx)}>
                  <MinusCircle className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>Deposit</Label>
            <Input type="number" min={0} step={0.01} value={deposit} onChange={(e) => setDeposit(Number(e.target.value))} />
          </div>
          <div>
            <Label>Due Date</Label>
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
          <div>
            <Label>Total</Label>
            <Input value={totalAmount} readOnly />
          </div>
        </div>
        <div>
          <Label>Notes</Label>
          <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional" />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button disabled={loading || !memberId || lines.some((l) => !l.item_id)} onClick={onSubmit}>
          {loading ? "Saving…" : "Create Rental"}
        </Button>
      </div>
    </div>
  );
}

function displayName(pi?: PersonalInfo | null, code?: string | null, id?: string) {
  const name = [pi?.first_name, pi?.middle_name, pi?.last_name].filter(Boolean).join(" ");
  return name || code || id || "—";
}


