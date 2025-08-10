"use client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

function LoginInner() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const search = useSearchParams();

  async function onSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    const email = String(formData.get("email") || "");
    const password = String(formData.get("password") || "");
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (error) setError(error.message);
    else {
      // ensure cookies are set in SSR client via session sync endpoint (for some deployments)
      try {
        await fetch("/api/auth/session", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            access_token: data?.session?.access_token,
            refresh_token: data?.session?.refresh_token,
          }),
        });
      } catch {}
      const nextParam = search.get("next");
      router.push(nextParam && nextParam.startsWith("/") ? nextParam : "/dashboard");
    }
  }

  return (
    <div className="max-w-md mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Sign in</h1>
      <p className="text-xs text-muted-foreground">Access is restricted to authorized admins. If you need access, contact IT.</p>
      <form action={onSubmit} className="space-y-4">
        <input
          type="email"
          name="email"
          placeholder="Email"
          className="w-full rounded border px-3 py-2"
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          className="w-full rounded border px-3 py-2"
          required
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          disabled={loading}
         className="px-3 py-2 rounded bg-primary text-primary-foreground disabled:opacity-50 hover:opacity-90"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
      <p className="text-sm text-muted-foreground">
        <a href="/forgot-password" className="underline">
          Forgot password?
        </a>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="max-w-md mx-auto p-6">Loading…</div>}>
      <LoginInner />
    </Suspense>
  );
}
