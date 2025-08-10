import Link from "next/link";
import DeleteButton from "@/components/ui/DeleteButton";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type InventoryItem = {
  id: string;
  sku: string;
  item_details: Record<string, unknown> | null;
  stock_levels?: Record<string, unknown> | null;
  created_at?: string;
};

async function fetchItems() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("inventory_items")
    .select("id, sku, item_details, stock_levels, created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw new Error(error.message);
  return (data ?? []) as InventoryItem[];
}

export default async function ItemsPage() {
  const items = await fetchItems();
  const totals = {
    total: items.length,
    low: items.filter((i: InventoryItem) => {
      const current = Number((i.stock_levels || {}).current ?? 0);
      const min = Number((i.stock_levels || {}).min ?? 0);
      return min > 0 && current <= min;
    }).length,
  };
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Inventory Items</h1>
          <p className="text-sm text-muted-foreground">Total: {totals.total} • Low stock: {totals.low}</p>
        </div>
        <Link
          href="/inventory/items/new"
          className="px-3 py-2 rounded bg-primary text-primary-foreground hover:opacity-90"
        >
          Add Item
        </Link>
      </div>
      <div className="overflow-x-auto rounded border">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-muted text-left">
              <th className="p-2">Item</th>
              <th className="p-2">SKU</th>
              <th className="p-2">Stock</th>
              <th className="p-2">Status</th>
              <th className="p-2">Added</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map(
              (i: InventoryItem) => {
                const details = (i.item_details || {}) as Record<string, unknown>;
                const stock = (i.stock_levels || {}) as Record<string, unknown>;
                const current = Number(stock.current ?? 0);
                const min = Number(stock.min ?? 0);
                const isLow = min > 0 && current <= min;
                const name = (details.name as string) || "—";
                const added = i.created_at ? new Date(i.created_at).toLocaleDateString() : "—";
                return (
                  <tr key={i.id} className="border-t">
                    <td className="p-2">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded bg-muted grid place-items-center text-[10px] text-muted-foreground border">
                          {name !== "—" ? name.split(" ").map(s => s[0]).join("").slice(0,2).toUpperCase() : "—"}
                        </div>
                        <div>
                          <div className="font-medium">{name}</div>
                          {details?.category && (
                            <div className="text-xs text-muted-foreground">{String(details.category)}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-2">{i.sku}</td>
                    <td className="p-2">{current}{min ? ` / min ${min}` : ""}</td>
                    <td className="p-2">
                      <span className={`px-2 py-0.5 rounded text-xs border ${isLow ? "bg-warning/10 border-warning/30 text-warning" : "bg-success/10 border-success/30 text-success"}`}>
                        {isLow ? "Low" : "OK"}
                      </span>
                    </td>
                    <td className="p-2">{added}</td>
                    <td className="p-2">
                      <div className="flex gap-2">
                        <Link className="px-2 py-1 text-sm rounded border" href={`/inventory/items/new?edit=${i.id}`}>Edit</Link>
                        <DeleteButton endpoint={`/api/inventory/items?id=${i.id}`} />
                      </div>
                    </td>
                  </tr>
                );
              },
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
