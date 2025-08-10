import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { 
  Users, 
  Package, 
  ReceiptText, 
  HandCoins, 
  AlertTriangle,
  Clock,
  Activity
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface ActivityItem {
  id: string;
  type: "member" | "payment" | "inventory" | "rental" | "expense" | "alert";
  title: string;
  description: string;
  timestamp: string;
  status?: "success" | "warning" | "error" | "info";
}

interface RecentActivityProps {
  activities: ActivityItem[];
  maxItems?: number;
  className?: string;
}

const activityIcons = {
  member: Users,
  payment: HandCoins,
  inventory: Package,
  rental: ReceiptText,
  expense: ReceiptText,
  alert: AlertTriangle,
};

const activityColors = {
  member: "text-success",
  payment: "text-primary",
  inventory: "text-info",
  rental: "text-warning",
  expense: "text-error",
  alert: "text-warning",
};

const statusColors = {
  success: "bg-success/10 text-success border-success/20",
  warning: "bg-warning/10 text-warning border-warning/20",
  error: "bg-error/10 text-error border-error/20",
  info: "bg-info/10 text-info border-info/20",
};

export function RecentActivity({ 
  activities, 
  maxItems = 5, 
  className 
}: RecentActivityProps) {
  const displayActivities = activities.slice(0, maxItems);

  return (
    <Card className={cn("transition-all duration-200 hover:shadow-lg", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {displayActivities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No recent activity</p>
            </div>
          ) : (
            displayActivities.map((activity) => {
              const Icon = activityIcons[activity.type];
              return (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 p-3 rounded-lg border border-border hover:border-primary/20 hover:bg-primary/5 transition-all duration-200"
                >
                  <div className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full",
                    activityColors[activity.type]
                  )}>
                    <Icon className="h-4 w-4" />
                  </div>
                  
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-foreground">
                        {activity.title}
                      </p>
                      {activity.status && (
                        <span className={cn(
                          "inline-flex items-center rounded-full border px-2 py-1 text-xs font-medium",
                          statusColors[activity.status]
                        )}>
                          {activity.status}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {activity.description}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {activity.timestamp}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
        
        {activities.length > maxItems && (
          <div className="mt-4 pt-4 border-t border-border">
            <button className="w-full text-sm text-primary hover:text-primary-dark transition-colors duration-200">
              View all activities ({activities.length})
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
