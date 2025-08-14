"use client";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  ReceiptText, 
  HandCoins, 
  Banknote, 
  LineChart, 
  LogOut, 
  Sun, 
  Moon,
  Menu,
  X,
  CreditCard,
  UserCheck,
  Building2,
  Bell,
  Settings
} from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Search } from "@/components/ui/search";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [signingOut, setSigningOut] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const supabase = createSupabaseBrowserClient();
  const pathname = usePathname();
  const { theme, setTheme, resolvedTheme } = useTheme();

  async function onSignOut() {
    setSigningOut(true);
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Ensure the current user's role is synced with allowlist on first render
  if (typeof window !== "undefined") {
    // fire and forget; ignore failures
    fetch("/api/admin/sync-role", { method: "POST" }).catch(() => {});
  }

  const nav = useMemo(
    () => [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/members", label: "Members", icon: Users },
      { href: "/membership/payments", label: "Membership Payments", icon: CreditCard },
      { href: "/membership/subscriptions", label: "Subscriptions", icon: UserCheck },
      { href: "/inventory/items", label: "Inventory", icon: Package },
      { href: "/inventory/rentals", label: "Rentals", icon: ReceiptText },
      { href: "/rent/collections", label: "Rent", icon: HandCoins },
      { href: "/rent/sources", label: "Rent Sources", icon: Banknote },
      { href: "/donations", label: "Donations", icon: HandCoins },
      { href: "/reports/profit-loss", label: "Profit & Loss", icon: LineChart },
      { href: "/expenses", label: "Expenses", icon: ReceiptText },
      { href: "/settings", label: "Settings", icon: Settings },
    ],
    [],
  );

  function isActive(href: string) {
    if (!pathname) return false;
    return pathname === href || pathname.startsWith(href + "/");
  }

  function ThemeToggle() {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    if (!mounted) return null;
    const isDark = (resolvedTheme || theme) === "dark";
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setTheme(isDark ? "light" : "dark")}
        className="w-full justify-start"
        aria-label="Toggle theme"
      >
        {isDark ? (
          <>
            <Sun className="h-4 w-4 mr-2" />
            Light Mode
          </>
        ) : (
          <>
            <Moon className="h-4 w-4 mr-2" />
            Dark Mode
          </>
        )}
      </Button>
    );
  }

  const handleSearch = (query: string) => {
    // TODO: Implement global search
    console.log("Searching for:", query);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="lg:hidden border-b bg-card px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <div className="flex items-center gap-2">
              <Building2 className="h-6 w-6 text-primary" />
              <span className="font-semibold text-lg">Kharwa Samaj</span>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Desktop Header */}
      <header className="hidden lg:block border-b bg-card px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <Building2 className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-xl font-bold">Kharwa Samaj</h1>
                <p className="text-sm text-muted-foreground">Community Management</p>
              </div>
            </div>
            <Search 
              placeholder="Search members, inventory, payments..." 
              onSearch={handleSearch}
              className="w-80"
            />
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" aria-label="Notifications">
              <Bell className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" aria-label="Settings">
              <Settings className="h-5 w-5" />
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr]">
        {/* Sidebar */}
        <aside className={cn(
          "fixed inset-y-0 left-0 z-50 w-80 transform bg-card border-r transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 lg:w-[280px]",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          <div className="flex h-full flex-col">
            {/* Sidebar Header - Only show on mobile */}
            <div className="border-b p-6 lg:hidden">
              <div className="flex items-center gap-3">
                <Building2 className="h-8 w-8 text-primary" />
                <div>
                <h1 className="text-xl font-bold">Kharwa Samaj</h1>
                  <p className="text-sm text-muted-foreground">Community Management</p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-1 p-4">
              <div className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Navigation
              </div>
              <div className="space-y-1">
                {nav.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                        active 
                          ? "bg-primary text-primary-foreground shadow-sm" 
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </nav>

            {/* Sidebar Footer */}
            <div className="border-t p-4 space-y-3">
              <ThemeToggle />
              <Button
                variant="outline"
                onClick={onSignOut}
                disabled={signingOut}
                className="w-full justify-start"
                aria-label="Sign out"
              >
                <LogOut className="h-4 w-4 mr-2" />
                {signingOut ? "Signing out…" : "Sign out"}
              </Button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="min-h-screen p-4 lg:p-8">
          {/* Mobile Menu Overlay */}
          {mobileMenuOpen && (
            <div 
              className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
          )}
          
          {children}
        </main>
      </div>
    </div>
  );
}
