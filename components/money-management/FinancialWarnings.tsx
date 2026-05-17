"use client";

import { AlertTriangle, TrendingDown, PiggyBank, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/utils/cn";

interface FinancialWarningsProps {
  monthlyIncome: number;
  monthlyExpenses: number;
  totalIncome: number;
  totalSavings: number;
  totalTradingPayouts: number;
  expenseIncreasePercent: number;
  capitalProtectionRisk: boolean;
  drawdownPercent: number;
}

export function FinancialWarnings({
  monthlyIncome,
  monthlyExpenses,
  totalIncome,
  totalSavings,
  totalTradingPayouts,
  expenseIncreasePercent,
  capitalProtectionRisk,
  drawdownPercent,
}: FinancialWarningsProps) {
  const warnings = [];

  const essentialExpenses = monthlyExpenses * 0.65;
  const nonEssentialSpending = Math.max(0, monthlyExpenses - essentialExpenses);
  const nonEssentialPercentage = monthlyIncome > 0 ? (nonEssentialSpending / monthlyIncome) * 100 : 0;

  if (expenseIncreasePercent >= 15) {
    warnings.push({
      type: "lifestyle_inflation",
      title: "Lifestyle Inflation Detected",
      message: `Your expenses rose by ${expenseIncreasePercent.toFixed(1)}% compared to last month. Slow discretionary spending growth.`,
      icon: TrendingDown,
      severity: "warning",
    });
  }

  if (nonEssentialPercentage > 40) {
    warnings.push({
      type: "lifestyle",
      title: "High Discretionary Spending",
      message: `Discretionary expenses represent an estimated ${nonEssentialPercentage.toFixed(1)}% of income. Maintain spending discipline.`,
      icon: TrendingDown,
      severity: "warning",
    });
  }

  if (monthlyExpenses > monthlyIncome) {
    warnings.push({
      type: "overspending",
      title: "Overspending Alert",
      message: "Your monthly expenses are above your income. Trim costs and protect liquidity.",
      icon: AlertTriangle,
      severity: "danger",
    });
  }

  const savingsRate = totalIncome > 0 ? (totalSavings / totalIncome) * 100 : 0;
  if (totalTradingPayouts > 10000 && savingsRate < 20) {
    warnings.push({
      type: "savings",
      title: "Savings Opportunity Missed",
      message: "Trading profits are strong but savings are below 20% of income. Allocate more to emergency and long-term wealth.",
      icon: PiggyBank,
      severity: "warning",
    });
  }

  if (capitalProtectionRisk) {
    warnings.push({
      type: "capital_protection",
      title: "Capital Protection Warning",
      message: `Trading income has dropped ${drawdownPercent.toFixed(1)}% while spending remains elevated. Protect capital now.`,
      icon: AlertTriangle,
      severity: "danger",
    });
  }

  // Warning: No budget set
  // This would require checking if budgets exist, but for now we'll skip

  if (warnings.length === 0) {
    return (
      <Card className="bg-green-500/10 border-green-500/20">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <h3 className="font-semibold text-green-400">Financial Health Good</h3>
              <p className="text-sm text-green-300">Your spending habits are well-managed. Keep it up!</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-foreground">Financial Warnings</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {warnings.map((warning, index) => (
          <Card
            key={index}
            className={cn(
              "border-l-4",
              warning.severity === "danger" && "border-l-red-500 bg-red-500/10",
              warning.severity === "warning" && "border-l-yellow-500 bg-yellow-500/10"
            )}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0",
                  warning.severity === "danger" && "bg-red-500/20",
                  warning.severity === "warning" && "bg-yellow-500/20"
                )}>
                  <warning.icon className={cn(
                    "h-4 w-4",
                    warning.severity === "danger" && "text-red-400",
                    warning.severity === "warning" && "text-yellow-400"
                  )} />
                </div>
                <div className="space-y-1">
                  <h4 className={cn(
                    "font-medium",
                    warning.severity === "danger" && "text-red-400",
                    warning.severity === "warning" && "text-yellow-400"
                  )}>
                    {warning.title}
                  </h4>
                  <p className="text-sm text-gray-300">{warning.message}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}