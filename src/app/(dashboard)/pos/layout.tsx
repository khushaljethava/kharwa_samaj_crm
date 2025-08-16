"use client";

import { useState, useEffect } from "react";
import {
  Receipt,
  Clock,
  Tag,
  ShoppingCart,
  BarChart3,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";

const NavLink = ({ href, children }: { href: string; children: React.ReactNode }) => {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link href={href}>
      <Button
        variant={isActive ? "secondary" : "ghost"}
        className={cn("flex items-center gap-2", {
          "bg-primary/10 text-primary": isActive,
        })}
      >
        {children}
      </Button>
    </Link>
  );
};

export default function POSLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-6">
              <Link href="/pos" className="flex items-center gap-2">
                <div className="rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500 p-2">
                  <ShoppingCart className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold">
                  POS System
                </span>
              </Link>
              
              <nav className="hidden items-center gap-2 md:flex">
                <NavLink href="/pos">
                  <Receipt className="h-4 w-4" />
                  Sales
                </NavLink>
                <NavLink href="/pos/items">
                  <Tag className="h-4 w-4" />
                  Items
                </NavLink>
                {/* Categories link removed */}
                <NavLink href="/pos/bills">
                  <BarChart3 className="h-4 w-4" />
                  Bills
                </NavLink>
                <NavLink href="/pos/settings">
                  <Settings className="h-4 w-4" />
                  Settings
                </NavLink>
              </nav>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="hidden text-sm text-muted-foreground sm:flex items-center">
                <Clock className="mr-1 h-4 w-4" />
                {time.toLocaleTimeString()}
              </div>
              {/* Add any other header items here, like user profile */}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4">
        {children}
      </main>
    </div>
  );
}