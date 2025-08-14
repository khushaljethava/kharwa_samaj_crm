"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export function DateRangeFilter({ basePath }: { basePath: string }) {
  const router = useRouter();
  const sp = useSearchParams();
  
  // Get today's date and first day of current month in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];
  const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
  
  const [start, setStart] = useState<string>(sp.get("start") || firstDayOfMonth);
  const [end, setEnd] = useState<string>(sp.get("end") || today);

  useEffect(() => {
    setStart(sp.get("start") || firstDayOfMonth);
    setEnd(sp.get("end") || today);
  }, [sp, firstDayOfMonth, today]);

  function apply() {
    const q = new URLSearchParams();
    if (start) q.set("start", start);
    if (end) q.set("end", end);
    const qs = q.toString();
    router.push(qs ? `${basePath}?${qs}` : basePath);
  }

  return (
    <div className="flex flex-wrap items-end gap-2">
      <div>
        <div className="text-xs text-muted-foreground">Start</div>
        <input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="rounded border px-2 py-1 text-sm" />
      </div>
      <div>
        <div className="text-xs text-muted-foreground">End</div>
        <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className="rounded border px-2 py-1 text-sm" />
      </div>
      <button onClick={apply} className="rounded border px-3 py-1.5 text-sm hover:bg-muted">Apply</button>
      {(start || end) && (
        <button onClick={() => { setStart(""); setEnd(""); router.push(basePath); }} className="rounded border px-3 py-1.5 text-sm hover:bg-muted">Clear</button>
      )}
    </div>
  );
}


