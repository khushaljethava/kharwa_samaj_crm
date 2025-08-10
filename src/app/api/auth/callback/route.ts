import { NextResponse } from "next/server";

export async function GET() {
  // Placeholder for auth callback handling if needed
  return NextResponse.redirect(
    new URL(
      "/dashboard",
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    ),
  );
}
