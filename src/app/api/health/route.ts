import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const rl = await rateLimit(request, "api:health:get");
  if (!rl.success)
    return NextResponse.json({ error: "Too Many Requests" }, { status: 429 });
  return NextResponse.json({ ok: true, ts: Date.now() });
}
