"use client";

import { useState } from "react";
import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/cn";

export type ActivityFilterType = 'all' | 'income' | 'expenses' | 'investments' | 'trading';
export type DateFilterType = 'monthly' | 'quarterly' | 'yearly';

interface FinancialFiltersProps {
  onActivityFilterChange: (filter: ActivityFilterType) => void;
  onDateFilterChange: (filter: DateFilterType) => void;
  activeActivityFilter: ActivityFilterType;
  activeDateFilter: DateFilterType;
}

const ACTIVITY_FILTERS: { label: string; value: ActivityFilterType; description: string }[] = [
  { label: 'All Activity', value: 'all', description: 'See everything' },
  { label: 'Income', value: 'income', description: 'Payouts & external income' },
  { label: 'Expenses', value: 'expenses', description: 'Spending & withdrawals' },
  { label: 'Investments', value: 'investments', description: 'Savings & allocations' },
  { label: 'Trading Costs', value: 'trading', description: 'Account purchases & fees' }
];

const DATE_FILTERS: { label: string; value: DateFilterType }[] = [
  { label: 'Monthly', value: 'monthly' },
  { label: 'Quarterly', value: 'quarterly' },
  { label: 'Yearly', value: 'yearly' }
];

export function FinancialFilters({
  onActivityFilterChange,
  onDateFilterChange,
  activeActivityFilter,
  activeDateFilter
}: FinancialFiltersProps) {
  const [showActivityFilter, setShowActivityFilter] = useState(false);
  const [showDateFilter, setShowDateFilter] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      {/* Activity Filters */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Activity Type</h3>
        </div>
        
        <div className="grid gap-2 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
          {ACTIVITY_FILTERS.map(filter => (
            <button
              key={filter.value}
              onClick={() => onActivityFilterChange(filter.value)}
              className={cn(
                "rounded-lg border px-3 py-2 text-left transition duration-200 text-sm",
                activeActivityFilter === filter.value
                  ? "border-sky-400 bg-sky-500/10 text-white shadow-[0_0_20px_-10px_rgba(56,189,248,0.3)]"
                  : "border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:bg-white/10"
              )}
            >
              <div className="font-medium">{filter.label}</div>
              <div className="text-xs text-slate-400 mt-0.5">{filter.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Date Range Filters */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Period</h3>
        
        <div className="flex gap-2">
          {DATE_FILTERS.map(filter => (
            <button
              key={filter.value}
              onClick={() => onDateFilterChange(filter.value)}
              className={cn(
                "rounded-lg border px-4 py-2 text-sm font-medium transition duration-200",
                activeDateFilter === filter.value
                  ? "border-sky-400 bg-sky-500/10 text-white shadow-[0_0_20px_-10px_rgba(56,189,248,0.3)]"
                  : "border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:bg-white/10"
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Active Filters Display */}
      {(activeActivityFilter !== 'all' || activeDateFilter !== 'monthly') && (
        <div className="flex gap-2 pt-2 border-t border-white/10">
          <span className="text-xs text-slate-400 self-center">Active filters:</span>
          <div className="flex gap-2 flex-wrap">
            {activeActivityFilter !== 'all' && (
              <div className="inline-flex items-center gap-1 rounded-full border border-sky-400/30 bg-sky-500/10 px-3 py-1 text-xs text-sky-300">
                {ACTIVITY_FILTERS.find(f => f.value === activeActivityFilter)?.label}
                <button onClick={() => onActivityFilterChange('all')} className="hover:text-sky-200">
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
            {activeDateFilter !== 'monthly' && (
              <div className="inline-flex items-center gap-1 rounded-full border border-sky-400/30 bg-sky-500/10 px-3 py-1 text-xs text-sky-300">
                {DATE_FILTERS.find(f => f.value === activeDateFilter)?.label}
                <button onClick={() => onDateFilterChange('monthly')} className="hover:text-sky-200">
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
