import { useEffect, useState } from "react";
import { SupabaseClient } from "@supabase/supabase-js";
import { DayFinancials, getFinancialCalendarData, calculateFinancialSummary } from "@/utils/financial-calendar";

interface UseFinancialCalendarProps {
  supabase: SupabaseClient;
  userId: string | undefined;
  startDate: Date;
  endDate: Date;
}

export function useFinancialCalendarRealtime({
  supabase,
  userId,
  startDate,
  endDate
}: UseFinancialCalendarProps) {
  const [days, setDays] = useState<DayFinancials[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch data whenever dependencies change
  useEffect(() => {
    if (!userId) return;

    async function fetchData() {
      setLoading(true);
      try {
        const data = await getFinancialCalendarData(supabase, userId!, startDate, endDate);
        setDays(data);
      } catch (error) {
        console.error('Error fetching financial calendar:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [userId, startDate, endDate, refreshKey]);

  // Real-time subscriptions
  useEffect(() => {
    if (!userId) return;

    const tables = [
      { table: 'payouts', filter: `user_id=eq.${userId}` },
      { table: 'expenses', filter: `user_id=eq.${userId}` },
      { table: 'external_income', filter: `user_id=eq.${userId}` },
      { table: 'capital_accounts', filter: `user_id=eq.${userId}` },
      { table: 'withdrawals', filter: `user_id=eq.${userId}` },
      { table: 'account_purchases', filter: `user_id=eq.${userId}` },
      { table: 'allocation_transfers', filter: `user_id=eq.${userId}` }
    ];

    const channels = tables.map(({ table, filter }) =>
      supabase
        .channel(`realtime-calendar-${table}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table, filter },
          () => {
            // Debounce the refresh
            setTimeout(() => setRefreshKey(prev => prev + 1), 100);
          }
        )
        .subscribe()
    );

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, [userId]);

  const summary = calculateFinancialSummary(days);

  return {
    days,
    loading,
    summary,
    refreshCalendar: () => setRefreshKey(prev => prev + 1)
  };
}
