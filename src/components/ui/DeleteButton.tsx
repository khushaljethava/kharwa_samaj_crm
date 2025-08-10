"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function DeleteButton({
  endpoint,
  label = "Delete",
  confirmMessage = "Are you sure you want to delete this item?",
  onDeleted,
}: {
  endpoint: string;
  label?: string;
  confirmMessage?: string;
  onDeleted?: () => void;
}) {
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm(confirmMessage)) return;
    setLoading(true);
    try {
      const res = await fetch(endpoint, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      if (onDeleted) onDeleted();
      else window.location.reload();
    } catch (e) {
      // eslint-disable-next-line no-alert
      alert((e as any)?.message || "Delete failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="destructive" size="sm" onClick={handleDelete} disabled={loading}>
      {loading ? "Deleting..." : label}
    </Button>
  );
}


