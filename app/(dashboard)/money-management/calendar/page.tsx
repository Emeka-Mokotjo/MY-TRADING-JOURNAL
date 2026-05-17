"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase/client";
import { useAuth } from "@/components/auth-provider";
import {
  getFinancialCalendarData,
  calculateFinancialSummary,
  DayFinancials
} from "@/utils/financial-calendar";
import { MoneyCalendar } from "@/components/MoneyCalendar";
import { DayDetailModal } from "@/components/DayDetailModal";
import { FinancialSummaryTiles } from "@/components/FinancialSummaryTiles";
import { FinancialFilters, ActivityFilterType, DateFilterType } from "@/components/FinancialFilters";

export default function MoneyCalendarPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState<DayFinancials[]>([]);
  const [selectedDay, setSelectedDay] = useState<DayFinancials | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [activityFilter, setActivityFilter] = useState<ActivityFilterType>('all');
  const [dateFilter, setDateFilter] = useState<DateFilterType>('monthly');
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch financial data
  useEffect(() => {
    const userId = user?.id;
    if (!userId) return;

    async function fetchData() {
      setLoading(true);

      // Determine date range based on filter
      let startDate: Date;
      let endDate = new Date();

      switch (dateFilter) {
        case 'quarterly':
          startDate = new Date(endDate.getFullYear(), endDate.getMonth() - 3, 1);
          break;
        case 'yearly':
          startDate = new Date(endDate.getFullYear() - 1, endDate.getMonth(), 1);
          break;
        case 'monthly':
        default:
          startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
          break;
      }

      const allDays = await getFinancialCalendarData(supabase, userId!, startDate, endDate);

      // Apply activity filter
      if (activityFilter !== 'all') {
        const filtered = allDays.map(day => ({
          ...day,
          activities: day.activities.filter(activity => {
            switch (activityFilter) {
              case 'income':
                return activity.type === 'income' || activity.type === 'capital';
              case 'expenses':
                return activity.type === 'expense';
              case 'investments':
                return activity.type === 'investment';
              case 'trading':
                return activity.type === 'trading';
              default:
                return true;
            }
          }),
          inflow: activityFilter === 'income'
            ? day.inflow
            : activityFilter === 'expenses'
            ? 0
            : day.inflow,
          outflow: activityFilter === 'expenses' || activityFilter === 'trading'
            ? day.outflow
            : activityFilter === 'investments'
            ? day.outflow
            : 0
        })).filter(day => day.activities.length > 0);
        setDays(filtered);
      } else {
        setDays(allDays);
      }

      setLoading(false);
    }

    fetchData();
  }, [user?.id, dateFilter, activityFilter, refreshKey]);

  // Real-time subscriptions
  useEffect(() => {
    const userId = user?.id;
    if (!userId) return;

    const channels = [
      supabase.channel('realtime-calendar-payouts')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'payouts', filter: `user_id=eq.${userId}` }, () => {
          setRefreshKey(prev => prev + 1);
        })
        .subscribe(),

      supabase.channel('realtime-calendar-expenses')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses', filter: `user_id=eq.${userId}` }, () => {
          setRefreshKey(prev => prev + 1);
        })
        .subscribe(),

      supabase.channel('realtime-calendar-income')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'external_income', filter: `user_id=eq.${userId}` }, () => {
          setRefreshKey(prev => prev + 1);
        })
        .subscribe(),

      supabase.channel('realtime-calendar-capital')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'capital_accounts', filter: `user_id=eq.${userId}` }, () => {
          setRefreshKey(prev => prev + 1);
        })
        .subscribe(),

      supabase.channel('realtime-calendar-withdrawals')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'withdrawals', filter: `user_id=eq.${userId}` }, () => {
          setRefreshKey(prev => prev + 1);
        })
        .subscribe(),

      supabase.channel('realtime-calendar-purchases')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'account_purchases', filter: `user_id=eq.${userId}` }, () => {
          setRefreshKey(prev => prev + 1);
        })
        .subscribe(),

      supabase.channel('realtime-calendar-transfers')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'allocation_transfers', filter: `user_id=eq.${userId}` }, () => {
          setRefreshKey(prev => prev + 1);
        })
        .subscribe()
    ];

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, [user?.id]);

  const summary = calculateFinancialSummary(days);

  if (loading) {
    return (
      <div className="p-8 text-gray-400">
        <p>Loading financial calendar...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <section>
        <h1 className="text-4xl font-semibold text-white">Money Activity Calendar</h1>
        <p className="mt-2 text-slate-400">
          Track every movement of capital, spending, income, and wealth allocation
        </p>
      </section>

      {/* Summary Tiles */}
      <section>
        <FinancialSummaryTiles summary={summary} />
      </section>

      {/* Filters */}
      <section>
        <FinancialFilters
          onActivityFilterChange={setActivityFilter}
          onDateFilterChange={setDateFilter}
          activeActivityFilter={activityFilter}
          activeDateFilter={dateFilter}
        />
      </section>

      {/* Calendar */}
      <section>
        <MoneyCalendar
          days={days}
          onDayClick={setSelectedDay}
          currentMonth={currentMonth}
          onMonthChange={setCurrentMonth}
        />
      </section>

      {/* Day Detail Modal */}
      <DayDetailModal day={selectedDay} onClose={() => setSelectedDay(null)} />
    </div>
  );
}