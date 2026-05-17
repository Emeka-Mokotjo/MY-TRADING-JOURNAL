"use client";

import { Trophy, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/utils/cn";

interface TraderFinancialHealthScoreProps {
  savingsRate: number;
  spendingDiscipline: number;
  budgetConsistency: number;
  currentWealth: number;
  totalTradingProfits: number;
  retentionRate: number;
  emergencyFundStrength: number;
  unnecessaryExpenses: number;
}

export function TraderFinancialHealthScore({
  savingsRate,
  spendingDiscipline,
  budgetConsistency,
  currentWealth,
  totalTradingProfits,
  retentionRate,
  emergencyFundStrength,
  unnecessaryExpenses,
}: TraderFinancialHealthScoreProps) {
  const savingsScore = Math.min(savingsRate, 100);
  const disciplineScore = Math.min(spendingDiscipline, 100);
  const budgetScore = Math.min(budgetConsistency, 100);
  const retentionScore = Math.min(retentionRate, 100);
  const emergencyScore = Math.min(emergencyFundStrength, 100);

  const expensePenalty = Math.min((unnecessaryExpenses / Math.max(1, currentWealth)) * 100, 30);

  const totalScore = Math.max(0, Math.min(100,
    savingsScore * 0.25 +
    disciplineScore * 0.2 +
    budgetScore * 0.2 +
    retentionScore * 0.2 +
    emergencyScore * 0.15 -
    expensePenalty * 0.15
  ));

  const getScoreLabel = (score: number) => {
    if (score >= 90) return { label: "Excellent", color: "text-green-400", bg: "bg-green-500/20" };
    if (score >= 70) return { label: "Good", color: "text-blue-400", bg: "bg-blue-500/20" };
    if (score >= 50) return { label: "Average", color: "text-yellow-400", bg: "bg-yellow-500/20" };
    return { label: "Needs Improvement", color: "text-red-400", bg: "bg-red-500/20" };
  };

  const scoreInfo = getScoreLabel(totalScore);

  // Calculate progress for circular indicator
  const circumference = 2 * Math.PI * 40; // radius = 40
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (totalScore / 100) * circumference;

  return (
    <Card className="bg-gradient-to-br from-card to-card/80 border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-400" />
          Trader Financial Health Score
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="text-3xl font-bold text-foreground">{totalScore.toFixed(0)}</div>
            <div className={cn("text-sm font-medium", scoreInfo.color)}>
              {scoreInfo.label}
            </div>
            <div className="text-xs text-gray-400">
              Based on savings, discipline, and wealth preservation
            </div>
          </div>

          {/* Circular Progress Indicator */}
          <div className="relative">
            <svg width="100" height="100" className="transform -rotate-90">
              {/* Background circle */}
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                className="text-gray-700"
              />
              {/* Progress circle */}
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                className={cn(
                  "transition-all duration-1000 ease-out",
                  scoreInfo.color.replace("text-", "text-")
                )}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className={cn("text-lg font-bold", scoreInfo.color)}>
                {totalScore.toFixed(0)}
              </div>
            </div>
          </div>
        </div>

        {/* Score Breakdown */}
        <div className="mt-6 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Savings Rate</span>
            <span className="text-foreground">{savingsRate.toFixed(1)}%</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Spending Discipline</span>
            <span className="text-foreground">{spendingDiscipline.toFixed(1)}%</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Budget Consistency</span>
            <span className="text-foreground">{budgetConsistency.toFixed(1)}%</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Retention Rate</span>
            <span className="text-foreground">{retentionRate.toFixed(1)}%</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Emergency Strength</span>
            <span className="text-foreground">{emergencyFundStrength.toFixed(1)}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}