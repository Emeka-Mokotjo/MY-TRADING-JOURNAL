import { Card, CardContent } from "@/components/ui/card";
import { AnimatedValue } from "@/components/ui/AnimatedValue";
import { cn } from "@/utils/cn";
import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string | number | ReactNode;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
}

export function StatCard({ title, value, icon: Icon, trend, trendUp }: StatCardProps) {
  const isPositive = trend === "up" || trendUp === true || (typeof trend === "string" && trend.includes("+"));
  const isNegative = trend === "down" || trendUp === false || (typeof trend === "string" && trend.includes("-"));

  const accentClass = isPositive
    ? "border-success/90"
    : isNegative
    ? "border-danger/90"
    : "border-primary/90";

  const glowColor = isPositive
    ? "rgba(34, 197, 94, 0.18)"
    : isNegative
    ? "rgba(251, 113, 133, 0.18)"
    : "rgba(124, 58, 237, 0.18)";

  const displayTrendText = trend === "up" || trend === "down" ? null : trend;
  const formattedValue = typeof value === "number" ? (
    <AnimatedValue
      value={value}
      format={(current) =>
        current.toLocaleString(undefined, {
          minimumFractionDigits: value % 1 === 0 ? 0 : 2,
          maximumFractionDigits: 2,
        })
      }
      className="block"
    />
  ) : (
    value
  );

  return (
    <Card
      className={`relative overflow-hidden transition-all duration-300 border-t-4 ${accentClass} bg-card`}
      style={{ boxShadow: `0 24px 60px -32px ${glowColor}` }}
    >
      <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-br from-white/15 via-transparent to-transparent opacity-40 pointer-events-none" />
      <CardContent className="relative p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-400">{title}</p>
            <p className="text-3xl font-semibold tracking-tight text-foreground">{formattedValue}</p>
          </div>
          <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/5 border border-white/10 text-white shadow-lg shadow-black/20">
            <Icon className="h-6 w-6" />
          </div>
        </div>
        {displayTrendText && (
          <div className="mt-4 flex items-center gap-2 text-sm text-slate-400 relative z-10">
            <span
              className={cn(
                "font-medium",
                isPositive ? "text-success" : isNegative ? "text-danger" : "text-primary"
              )}
            >
              {displayTrendText}
            </span>
            <span className="text-slate-500">vs last month</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
