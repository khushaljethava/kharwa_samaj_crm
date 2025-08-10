export default function AccessDeniedPage() {
  return (
    <div className="max-w-md mx-auto p-6 space-y-4 text-center">
      <h1 className="text-2xl font-semibold">Access denied</h1>
      <p className="text-sm text-muted-foreground">
        You are not authorized to access this application. Contact an administrator if you believe this is a mistake.
      </p>
      <a href="/login" className="underline text-sm">Back to sign in</a>
    </div>
  );
}


