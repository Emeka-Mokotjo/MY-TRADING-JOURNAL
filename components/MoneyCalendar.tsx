"use client";

import { useState, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayFinancials, FinancialActivity } from "@/utils/financial-calendar";
import { cn } from "@/utils/cn";
import { Button } from "@/components/ui/button";
import { usePrivacy } from "@/contexts/PrivacyContext";

interface MoneyCalendarProps {
  days: DayFinancials[];
  onDayClick: (day: DayFinancials) => void;
  currentMonth?: Date;
  onMonthChange?: (date: Date) => void;
}

export function MoneyCalendar({
  days,
  onDayClick,
  currentMonth = new Date(),
  onMonthChange
}: MoneyCalendarProps) {
  const { privacyMode } = usePrivacy();
  const [month, setMonth] = useState(currentMonth);

  // Get calendar grid for the month
  const calendarDays = useMemo(() => {
    const year = month.getFullYear();
    const monthNum = month.getMonth();

    const firstDay = new Date(year, monthNum, 1);
    const lastDay = new Date(year, monthNum + 1, 0);
    const prevLastDay = new Date(year, monthNum, 0);

    const firstDayOfWeek = firstDay.getDay();
    const lastDateOfMonth = lastDay.getDate();
    const lastDayOfWeek = lastDay.getDay();
    const prevLastDate = prevLastDay.getDate();

    const calendarGrid: (number | null)[] = [];

    // Previous month's days
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      calendarGrid.push(null);
    }

    // Current month's days
    for (let i = 1; i <= lastDateOfMonth; i++) {
      calendarGrid.push(i);
    }

    // Next month's days
    const remainingDays = 42 - calendarGrid.length;
    for (let i = 1; i <= remainingDays; i++) {
      calendarGrid.push(null);
    }

    return calendarGrid;
  }, [month]);

  const daysMap = useMemo(() => {
    const map = new Map<string, DayFinancials>();
    days.forEach(day => {
      map.set(day.date, day);
    });
    return map;
  }, [days]);

  const formatDate = (dayNum: number | null) => {
    if (!dayNum) return null;
    const year = month.getFullYear();
    const monthNum = month.getMonth();
    const date = new Date(year, monthNum, dayNum);
    return date.toISOString().split('T')[0];
  };

  const handlePrevMonth = () => {
    const prev = new Date(month.getFullYear(), month.getMonth() - 1, 1);
    setMonth(prev);
    onMonthChange?.(prev);
  };

  const handleNextMonth = () => {
    const next = new Date(month.getFullYear(), month.getMonth() + 1, 1);
    setMonth(next);
    onMonthChange?.(next);
  };

  const monthName = month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-white">{monthName}</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevMonth}
            className="border-white/10 hover:border-sky-400/30"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextMonth}
            className="border-white/10 hover:border-sky-400/30"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="rounded-[1.75rem] border border-white/10 bg-card/80 p-6 shadow-[0_20px_60px_-40px_rgba(0,0,0,0.8)]">
        {/* Day names */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="h-10 flex items-center justify-center text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {day}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map((dayNum, idx) => {
            if (dayNum === null) {
              return <div key={`empty-${idx}`} className="aspect-square" />;
            }

            const dateStr = formatDate(dayNum);
            const dayData = dateStr ? daysMap.get(dateStr) : null;

            const getGradient = () => {
              if (!dayData) return 'from-slate-800/30 to-slate-800/10';
              
              const intensity = Math.min(Math.abs(dayData.netFlow) / 5000, 1);
              
              if (dayData.status === 'positive') {
                return `from-blue-500/${Math.round(20 + intensity * 40)} to-blue-500/${Math.round(10 + intensity * 20)}`;
              } else if (dayData.status === 'negative') {
                return `from-red-500/${Math.round(20 + intensity * 40)} to-red-500/${Math.round(10 + intensity * 20)}`;
              }
              return 'from-slate-700/20 to-slate-700/10';
            };

            const getBorder = () => {
              if (!dayData) return 'border-white/5';
              if (dayData.status === 'positive') return 'border-blue-500/30';
              if (dayData.status === 'negative') return 'border-red-500/30';
              return 'border-white/10';
            };

            return (
              <button
                key={`day-${dayNum}`}
                onClick={() => dayData && onDayClick(dayData)}
                disabled={!dayData}
                className={cn(
                  "aspect-square rounded-lg border transition-all duration-200 overflow-hidden",
                  "flex flex-col items-center justify-center p-2 text-center",
                  dayData ? "cursor-pointer hover:border-sky-400/40 hover:shadow-[0_0_20px_-10px_rgba(56,189,248,0.3)]" : "cursor-default opacity-30",
                  `bg-gradient-to-br ${getGradient()} ${getBorder()}`
                )}
              >
                {/* Day number */}
                <div className="text-sm font-semibold text-white">{dayNum}</div>

                {/* Day info */}
                {dayData && (
                  <div className="mt-1 space-y-0.5 w-full">
                    <div className="text-[10px] text-slate-300 font-medium">
                      {privacyMode ? (
                        <span className="text-slate-500">***</span>
                      ) : (
                        dayData.netFlow >= 0 ? (
                          <span className="text-green-400">+${(dayData.netFlow / 1000).toFixed(1)}k</span>
                        ) : (
                          <span className="text-red-400">-${Math.abs(dayData.netFlow / 1000).toFixed(1)}k</span>
                        )
                      )}
                    </div>
                    <div className="text-[9px] text-slate-400">
                      {dayData.activityCount} {dayData.activityCount === 1 ? 'activity' : 'activities'}
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-6 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-gradient-to-br from-blue-500/40 to-blue-500/20 border border-blue-500/30" />
          <span className="text-slate-400">Positive Cashflow</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-gradient-to-br from-red-500/40 to-red-500/20 border border-red-500/30" />
          <span className="text-slate-400">Negative Cashflow</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-gradient-to-br from-slate-700/20 to-slate-700/10 border border-white/10" />
          <span className="text-slate-400">Neutral</span>
        </div>
      </div>
    </div>
  );
}
