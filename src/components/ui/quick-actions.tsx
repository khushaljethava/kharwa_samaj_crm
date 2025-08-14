import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./card";

import { 
  Users, 
  Package, 
  ReceiptText, 
  HandCoins, 
  Plus,
  ArrowRight,
  CreditCard
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";

interface QuickAction {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  variant?: "default" | "success" | "warning" | "error" | "info";
}

const quickActions: QuickAction[] = [
  {
    title: "Add Member",
    description: "Register new community member",
    icon: Users,
    href: "/members/new",
    variant: "success",
  },
  {
    title: "Add Inventory Item",
    description: "Add new item to inventory",
    icon: Package,
    href: "/inventory/items/new",
    variant: "info",
  },
  {
    title: "Collect Rent",
    description: "Record rent payment",
    icon: HandCoins,
    href: "/rent/collections/new",
    variant: "default",
  },
  {
    title: "Membership Payment",
    description: "Record membership fee payment",
    icon: CreditCard,
    href: "/membership/payments/new",
    variant: "info",
  },
  {
    title: "Record Expense",
    description: "Log company expense",
    icon: ReceiptText,
    href: "/expenses/new",
    variant: "warning",
  },
];

export function QuickActions() {
  return (
    <Card className="transition-all duration-200 hover:shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5 text-primary" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.href} href={action.href}>
                <div className="group relative overflow-hidden rounded-lg border border-border bg-card p-4 transition-all duration-200 hover:border-primary/50 hover:bg-primary/5 hover:shadow-md">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className={cn(
                        "inline-flex h-10 w-10 items-center justify-center rounded-lg",
                        {
                          "bg-success/10 text-success": action.variant === "success",
                          "bg-info/10 text-info": action.variant === "info",
                          "bg-warning/10 text-warning": action.variant === "warning",
                          "bg-primary/10 text-primary": action.variant === "default",
                        }
                      )}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-medium text-foreground group-hover:text-primary">
                          {action.title}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {action.description}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-hover:translate-x-1 group-hover:text-primary" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
