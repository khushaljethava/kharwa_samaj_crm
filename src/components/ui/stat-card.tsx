import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { cn } from "@/lib/utils/cn";
import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  trend?: {
    value: number;
    isPositive: boolean;
    period?: string;
  };
  icon?: LucideIcon;
  variant?: "default" | "success" | "warning" | "error" | "info";
  description?: string;
  className?: string;
}

// reserved for future styling variants
const _variantStyles = {
  default: "border-border",
  success: "border-success/20 bg-success/5",
  warning: "border-warning/20 bg-warning/5", 
  error: "border-error/20 bg-error/5",
  info: "border-info/20 bg-info/5",
};

const iconColors = {
  default: "text-muted-foreground",
  success: "text-success",
  warning: "text-warning",
  error: "text-error", 
  info: "text-info",
};

export function StatCard({
  title,
  value,
  trend,
  icon: Icon,
  variant = "default",
  description,
  className,
}: StatCardProps) {
  const getTrendIcon = () => {
    if (!trend) return null;
    
    if (trend.value > 0) {
      return <TrendingUp className="h-4 w-4 text-success" />;
    } else if (trend.value < 0) {
      return <TrendingDown className="h-4 w-4 text-error" />;
    } else {
      return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getTrendColor = () => {
    if (!trend) return "text-muted-foreground";
    return trend.value > 0 ? "text-success" : trend.value < 0 ? "text-error" : "text-muted-foreground";
  };

  return (
    <Card 
      variant={variant} 
      className={cn("transition-all duration-200 hover:scale-[1.02]", className)}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {Icon && (
          <div className={cn("rounded-lg p-2", iconColors[variant])}>
            <Icon className="h-4 w-4" />
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-2xl font-bold">{value}</div>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
          {trend && (
            <div className="flex items-center space-x-1">
              {getTrendIcon()}
              <span className={cn("text-sm font-medium", getTrendColor())}>
                {Math.abs(trend.value)}%
              </span>
              {trend.period && (
                <span className="text-xs text-muted-foreground">
                  {trend.period}
                </span>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
