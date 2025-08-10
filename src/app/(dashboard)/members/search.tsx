"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";

export default function MembersSearch() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debouncedQ = useDebounce(q, 250);

  useEffect(() => {
    let ignore = false;
    async function run() {
      setError(null);
      if (!debouncedQ || debouncedQ.length < 2) {
        setResults([]);
        return;
      }
      setLoading(true);
      const res = await fetch(`/api/members/search?q=${encodeURIComponent(debouncedQ)}`);
      setLoading(false);
      if (!res.ok) {
        setError("Search failed");
        setResults([]);
        return;
      }
      const json = await res.json();
      if (!ignore) setResults(Array.isArray(json?.data) ? json.data : []);
    }
    run();
    return () => {
      ignore = true;
    };
  }, [debouncedQ]);

  return (
    <div className="space-y-2">
      <Input
        placeholder="Search by name or code..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      {loading && <div className="text-sm text-muted-foreground">Searching…</div>}
      {error && <div className="text-sm text-red-600">{error}</div>}
      {results.length > 0 && (
        <div className="rounded border divide-y">
          {results.map((m) => {
            const pi = (m.personal_info || {}) as Record<string, unknown>;
            const name = [pi.first_name as string, pi.middle_name as string, pi.last_name as string]
              .filter(Boolean)
              .join(" ") || "—";
            return (
              <div key={m.id} className="p-2 text-sm flex items-center justify-between">
                <div>
                  <div className="font-medium">{name}</div>
                  <div className="text-muted-foreground">{m.member_code || "—"}</div>
                </div>
                <div className="flex items-center gap-3">
                  <Link className="underline" href={`/members/${m.id}`}>View</Link>
                  <Link className="underline" href={`/members/${m.id}/tree`}>Family Tree</Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function useDebounce<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}


