"use client";
import Link from "next/link";

export default function RegisterPage() {
  return (
    <div className="max-w-md mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Registration disabled</h1>
      <p className="text-sm text-muted-foreground">
        This application is for internal use only. If you need access, please contact an administrator.
      </p>
      <Link href="/login" className="underline text-sm">
        Back to sign in
      </Link>
    </div>
  );
}


