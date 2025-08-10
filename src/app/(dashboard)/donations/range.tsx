"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export function DateRangeFilter({ basePath }: { basePath: string }) {
  const router = useRouter();
  const sp = useSearchParams();
  const [start, setStart] = useState<string>(sp.get("start") || "");
  const [end, setEnd] = useState<string>(sp.get("end") || "");

  useEffect(() => {
    setStart(sp.get("start") || "");
    setEnd(sp.get("end") || "");
  }, [sp]);

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


