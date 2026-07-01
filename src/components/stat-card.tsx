import { type ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TrendingDown, TrendingUp } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string;
  hint?: string;
  trend?: number;
  icon?: ReactNode;
  accent?: "primary" | "success" | "warning" | "destructive" | "info";
}

const accentMap = {
  primary: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/20 text-warning-foreground",
  destructive: "bg-destructive/10 text-destructive",
  info: "bg-info/10 text-info",
};

export function StatCard({ label, value, hint, trend, icon, accent = "primary" }: StatCardProps) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight truncate">{value}</p>
          {(hint || trend !== undefined) && (
            <div className="mt-2 flex items-center gap-2 text-xs">
              {trend !== undefined && (
                <span className={cn("flex items-center gap-0.5 font-medium", trend >= 0 ? "text-success" : "text-destructive")}>
                  {trend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {Math.abs(trend)}%
                </span>
              )}
              {hint && <span className="text-muted-foreground">{hint}</span>}
            </div>
          )}
        </div>
        {icon && (
          <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-lg", accentMap[accent])}>
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}
