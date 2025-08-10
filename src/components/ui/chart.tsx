import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { cn } from "@/lib/utils/cn";

interface ChartData {
  label: string;
  value: number;
  color?: string;
}

interface ChartProps {
  title: string;
  data: ChartData[];
  className?: string;
  height?: number;
  showValues?: boolean;
}

export function Chart({ 
  title, 
  data, 
  className, 
  height = 200, 
  showValues = true 
}: ChartProps) {
  const maxValue = Math.max(...data.map(d => d.value));
  
  return (
    <Card className={cn("transition-all duration-200", className)}>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.map((item, index) => {
            const percentage = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
            const color = item.color || `hsl(${(index * 137.5) % 360}, 70%, 50%)`;
            
            return (
              <div key={item.label} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{item.label}</span>
                  {showValues && (
                    <span className="text-muted-foreground">
                      {typeof item.value === 'number' && item.value % 1 === 0 
                        ? item.value.toLocaleString() 
                        : item.value.toFixed(2)}
                    </span>
                  )}
                </div>
                <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500 ease-out"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: color,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

interface LineChartProps {
  title: string;
  data: Array<{ label: string; value: number }>;
  className?: string;
  height?: number;
  color?: string;
}

export function LineChart({ 
  title, 
  data, 
  className, 
  height = 200, 
  color = "hsl(var(--primary))" 
}: LineChartProps) {
  if (data.length < 2) return null;
  
  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const range = maxValue - minValue;
  
  const points = data.map((item, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = range > 0 ? 100 - ((item.value - minValue) / range) * 100 : 50;
    return `${x}%,${y}%`;
  }).join(' ');
  
  return (
    <Card className={cn("transition-all duration-200", className)}>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative" style={{ height }}>
          <svg
            className="w-full h-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <polyline
              fill="none"
              stroke={color}
              strokeWidth="2"
              points={points}
              vectorEffect="non-scaling-stroke"
            />
            {data.map((item, index) => {
              const x = (index / (data.length - 1)) * 100;
              const y = range > 0 ? 100 - ((item.value - minValue) / range) * 100 : 50;
              return (
                <circle
                  key={index}
                  cx={`${x}%`}
                  cy={`${y}%`}
                  r="2"
                  fill={color}
                  vectorEffect="non-scaling-stroke"
                />
              );
            })}
          </svg>
          <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-muted-foreground">
            {data.map((item, index) => (
              <span key={index} className="text-center">
                {item.label}
              </span>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
