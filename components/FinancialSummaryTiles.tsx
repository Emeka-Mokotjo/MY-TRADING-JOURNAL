"use client";

import { TrendingUp, TrendingDown, DollarSign, Calendar, Zap, Award } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { usePrivacy } from "@/contexts/PrivacyContext";
import { cn } from "@/utils/cn";

interface FinancialSummary {
  totalInflow: number;
  totalOutflow: number;
  totalCashflow: number;
  bestDay: { date: string; amount: number } | null;
  worstDay: { date: string; amount: number } | null;
  averageDailyFlow: number;
  positiveDays: number;
  negativeDays: number;
  neutralDays: number;
}

interface FinancialSummaryTilesProps {
  summary: FinancialSummary;
}

function formatCurrency(amount: number, privacyMode: boolean) {
  if (privacyMode) return '*****';
  return `$${amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function FinancialSummaryTiles({ summary }: FinancialSummaryTilesProps) {
  const { privacyMode } = usePrivacy();

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Total Cashflow */}
      <Card className="overflow-hidden border-t-4 border-white/10 bg-card">
        <CardContent className="relative p-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-400">Total Cashflow</p>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 border border-white/10">
                <DollarSign className="h-5 w-5 text-slate-300" />
              </div>
            </div>
            <p className={cn(
              "text-3xl font-semibold",
              summary.totalCashflow >= 0 ? "text-green-400" : "text-red-400"
            )}>
              {formatCurrency(summary.totalCashflow, privacyMode)}
            </p>
            <p className="text-xs text-slate-500">
              {summary.totalCashflow >= 0 ? 'Positive' : 'Negative'} period
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Total Income */}
      <Card className="overflow-hidden border-t-4 border-green-500/50 bg-card">
        <CardContent className="relative p-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-400">Total Income</p>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10 border border-green-500/20">
                <TrendingUp className="h-5 w-5 text-green-400" />
              </div>
            </div>
            <p className="text-3xl font-semibold text-green-400">
              {formatCurrency(summary.totalInflow, privacyMode)}
            </p>
            <p className="text-xs text-slate-500">
              All inflows tracked
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Total Expenses */}
      <Card className="overflow-hidden border-t-4 border-red-500/50 bg-card">
        <CardContent className="relative p-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-400">Total Expenses</p>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10 border border-red-500/20">
                <TrendingDown className="h-5 w-5 text-red-400" />
              </div>
            </div>
            <p className="text-3xl font-semibold text-red-400">
              {formatCurrency(summary.totalOutflow, privacyMode)}
            </p>
            <p className="text-xs text-slate-500">
              All outflows tracked
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Best Day */}
      <Card className="overflow-hidden border-t-4 border-blue-500/50 bg-card">
        <CardContent className="relative p-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-400">Best Cashflow Day</p>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10 border border-blue-500/20">
                <Award className="h-5 w-5 text-blue-400" />
              </div>
            </div>
            {summary.bestDay ? (
              <>
                <p className="text-3xl font-semibold text-blue-400">
                  {formatCurrency(summary.bestDay.amount, privacyMode)}
                </p>
                <p className="text-xs text-slate-500">
                  {formatDate(summary.bestDay.date)}
                </p>
              </>
            ) : (
              <>
                <p className="text-3xl font-semibold text-slate-500">—</p>
                <p className="text-xs text-slate-600">No data</p>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Positive Days */}
      <Card className="overflow-hidden border-t-4 border-green-500/30 bg-card">
        <CardContent className="relative p-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-400">Positive Days</p>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10 border border-green-500/20">
                <Zap className="h-5 w-5 text-green-400" />
              </div>
            </div>
            <p className="text-3xl font-semibold text-green-400">
              {summary.positiveDays}
            </p>
            <p className="text-xs text-slate-500">
              days with positive net flow
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Negative Days */}
      <Card className="overflow-hidden border-t-4 border-red-500/30 bg-card">
        <CardContent className="relative p-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-400">Negative Days</p>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10 border border-red-500/20">
                <TrendingDown className="h-5 w-5 text-red-400" />
              </div>
            </div>
            <p className="text-3xl font-semibold text-red-400">
              {summary.negativeDays}
            </p>
            <p className="text-xs text-slate-500">
              days with negative net flow
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Neutral Days */}
      <Card className="overflow-hidden border-t-4 border-slate-500/30 bg-card">
        <CardContent className="relative p-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-400">Neutral Days</p>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-500/10 border border-slate-500/20">
                <Calendar className="h-5 w-5 text-slate-400" />
              </div>
            </div>
            <p className="text-3xl font-semibold text-slate-400">
              {summary.neutralDays}
            </p>
            <p className="text-xs text-slate-500">
              days with balanced flow
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Average Daily Flow */}
      <Card className="overflow-hidden border-t-4 border-purple-500/50 bg-card">
        <CardContent className="relative p-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-400">Avg Daily Flow</p>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/10 border border-purple-500/20">
                <DollarSign className="h-5 w-5 text-purple-400" />
              </div>
            </div>
            <p className={cn(
              "text-3xl font-semibold",
              summary.averageDailyFlow >= 0 ? "text-purple-400" : "text-purple-400"
            )}>
              {formatCurrency(summary.averageDailyFlow, privacyMode)}
            </p>
            <p className="text-xs text-slate-500">
              per day on average
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
