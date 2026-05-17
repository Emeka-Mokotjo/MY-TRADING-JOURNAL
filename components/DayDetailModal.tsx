"use client";

import { useState } from "react";
import { X, TrendingUp, TrendingDown, ArrowRight } from "lucide-react";
import { DayFinancials, FinancialActivity } from "@/utils/financial-calendar";
import { usePrivacy } from "@/contexts/PrivacyContext";
import { cn } from "@/utils/cn";

interface DayDetailModalProps {
  day: DayFinancials | null;
  onClose: () => void;
}

const ACTIVITY_ICONS: Record<string, React.ReactNode> = {
  'income': <TrendingUp className="w-4 h-4 text-green-400" />,
  'expense': <TrendingDown className="w-4 h-4 text-red-400" />,
  'investment': <ArrowRight className="w-4 h-4 text-blue-400" />,
  'trading': <ArrowRight className="w-4 h-4 text-purple-400" />,
  'capital': <TrendingUp className="w-4 h-4 text-emerald-400" />,
  'transfer': <ArrowRight className="w-4 h-4 text-slate-400" />
};

const CATEGORY_COLORS: Record<string, string> = {
  'Trading Payout': 'bg-green-500/10 border-green-500/30 text-green-300',
  'External Income': 'bg-green-500/10 border-green-500/30 text-green-300',
  'Capital Added': 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
  'Withdrawal': 'bg-red-500/10 border-red-500/30 text-red-300',
  'Funded Account': 'bg-purple-500/10 border-purple-500/30 text-purple-300',
  'Salary Income': 'bg-green-500/10 border-green-500/30 text-green-300',
  'Business Income': 'bg-green-500/10 border-green-500/30 text-green-300',
  'Freelance Income': 'bg-green-500/10 border-green-500/30 text-green-300',
  'Bonus Income': 'bg-green-500/10 border-green-500/30 text-green-300',
  'Other Income': 'bg-green-500/10 border-green-500/30 text-green-300',
  'Lifestyle': 'bg-orange-500/10 border-orange-500/30 text-orange-300',
  'Bills': 'bg-red-500/10 border-red-500/30 text-red-300',
  'Food': 'bg-orange-500/10 border-orange-500/30 text-orange-300',
  'Transport': 'bg-orange-500/10 border-orange-500/30 text-orange-300',
  'Entertainment': 'bg-orange-500/10 border-orange-500/30 text-orange-300',
};

function formatCurrency(amount: number, privacyMode: boolean) {
  if (privacyMode) return '*****';
  return `$${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category] || 'bg-slate-700/20 border-white/10 text-slate-300';
}

export function DayDetailModal({ day, onClose }: DayDetailModalProps) {
  const { privacyMode } = usePrivacy();

  if (!day) return null;

  const incomeActivities = day.activities.filter(a => a.type === 'income' || a.type === 'capital');
  const expenseActivities = day.activities.filter(a => a.type === 'expense' || a.type === 'trading');
  const investmentActivities = day.activities.filter(a => a.type === 'investment');

  const date = new Date(day.date);
  const formattedDate = date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[2rem] border border-white/10 bg-card/95 shadow-[0_40px_120px_-60px_rgba(0,0,0,0.85)]">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-card/95 px-8 py-6">
          <div>
            <h2 className="text-2xl font-semibold text-white">{formattedDate}</h2>
            <p className="mt-1 text-sm text-slate-400">Financial Activity Details</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 hover:bg-white/10 transition"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="px-8 py-6 space-y-8">
          {/* Summary Row */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Total Inflow</p>
              <p className="mt-2 text-2xl font-bold text-green-400">
                {formatCurrency(day.inflow, privacyMode)}
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Total Outflow</p>
              <p className="mt-2 text-2xl font-bold text-red-400">
                {formatCurrency(day.outflow, privacyMode)}
              </p>
            </div>
            <div className={cn(
              "rounded-xl border p-4 font-bold text-2xl",
              day.netFlow >= 0
                ? "border-green-500/30 bg-green-500/10 text-green-400"
                : "border-red-500/30 bg-red-500/10 text-red-400"
            )}>
              <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-2">Net Cashflow</p>
              {formatCurrency(day.netFlow, privacyMode)}
            </div>
          </div>

          {/* Income Section */}
          {incomeActivities.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Income & Capital</h3>
              <div className="space-y-2">
                {incomeActivities.map(activity => (
                  <ActivityItem key={activity.id} activity={activity} privacyMode={privacyMode} />
                ))}
              </div>
            </div>
          )}

          {/* Expense Section */}
          {expenseActivities.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Expenses & Trading</h3>
              <div className="space-y-2">
                {expenseActivities.map(activity => (
                  <ActivityItem key={activity.id} activity={activity} privacyMode={privacyMode} />
                ))}
              </div>
            </div>
          )}

          {/* Investment Section */}
          {investmentActivities.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Allocations & Investments</h3>
              <div className="space-y-2">
                {investmentActivities.map(activity => (
                  <ActivityItem key={activity.id} activity={activity} privacyMode={privacyMode} />
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {day.activities.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-slate-400">No financial activity recorded for this day.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ActivityItem({ activity, privacyMode }: { activity: FinancialActivity; privacyMode: boolean }) {
  const isIncome = activity.type === 'income' || activity.type === 'capital';
  const isExpense = activity.type === 'expense' || activity.type === 'trading';

  return (
    <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-4 transition hover:border-white/20 hover:bg-white/10">
      <div className="flex items-center gap-4 flex-1">
        {/* Icon */}
        <div className="flex-shrink-0">
          {ACTIVITY_ICONS[activity.type] || ACTIVITY_ICONS['transfer']}
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={cn(
              "text-xs px-2.5 py-1 rounded-full border font-medium",
              getCategoryColor(activity.category)
            )}>
              {activity.category}
            </span>
          </div>
          <p className="text-sm text-slate-300 truncate">{activity.description}</p>
        </div>
      </div>

      {/* Amount */}
      <div className={cn(
        "text-right flex-shrink-0 font-semibold",
        isIncome ? "text-green-400" : isExpense ? "text-red-400" : "text-blue-400"
      )}>
        <div className="text-lg">
          {isIncome ? '+' : '-'}{formatCurrency(activity.amount, privacyMode)}
        </div>
      </div>
    </div>
  );
}
