"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function NewInventoryItemPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    const sku = String(formData.get("sku") || "");
    const name = String(formData.get("name") || "");
    const price = Number(formData.get("price") || 0);
    const minQty = Number(formData.get("min_qty") || 0);
    const body = {
      sku,
      item_details: { name },
      pricing_info: { price },
      stock_levels: { current: 0, min: minQty },
    };
    try {
      const res = await fetch("/api/inventory/items", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      
      setLoading(false);
      
      if (res.ok) {
        toast.success("✅ Inventory item created successfully!");
        router.push("/inventory/items");
        return;
      }
      
      const errorData = await res.json().catch(() => ({}));
      const errorMessage = errorData?.error || "Failed to create item";
      
      setError(errorMessage);
      toast.error(`❌ ${errorMessage}`);
      
    } catch (err) {
      setLoading(false);
      const errorMessage = "Network error. Please try again.";
      setError(errorMessage);
      toast.error(`❌ ${errorMessage}`);
    }
  }

  return (
    <div className="space-y-6 max-w-xl">
      <h1 className="text-xl font-semibold">New Inventory Item</h1>
      <form action={onSubmit} className="space-y-4">
        <input name="sku" placeholder="SKU" className="w-full rounded border px-3 py-2" required />
        <input name="name" placeholder="Name" className="w-full rounded border px-3 py-2" required />
        <div className="grid grid-cols-2 gap-2">
          <input name="price" type="number" step="0.01" placeholder="Price" className="w-full rounded border px-3 py-2" />
          <input name="min_qty" type="number" step="1" placeholder="Min Qty" className="w-full rounded border px-3 py-2" />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button disabled={loading} className="px-3 py-2 rounded bg-primary text-primary-foreground disabled:opacity-50 hover:opacity-90">
          {loading ? "Saving..." : "Save"}
        </button>
      </form>
    </div>
  );
}


