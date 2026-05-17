"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/utils/supabase/client";
import { useAuth } from "@/components/auth-provider";
import { formatZAR } from "@/utils/currency";

interface CalendarDay {
  date: string;
  expenses: number;
  income: number;
  payout: number;
}

function formatCell(value: number) {
  if (value > 0) return `+${formatZAR(value)}`;
  if (value < 0) return `-${formatZAR(Math.abs(value))}`;
  return "—";
}

export function WealthHeatmapCalendar() {
  const { user } = useAuth();
  const [days, setDays] = useState<CalendarDay[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - 29);

      const startDate = start.toISOString().split('T')[0];
      const endDate = end.toISOString().split('T')[0];

      try {
        const [
          { data: expenseData },
          { data: incomeData },
          { data: payoutData },
        ] = await Promise.all([
          supabase.from("expense_entries").select("spent_at, amount").eq("user_id", user.id).gte("spent_at", startDate).lte("spent_at", endDate),
          supabase.from("income_entries").select("received_at, amount").eq("user_id", user.id).gte("received_at", startDate).lte("received_at", endDate),
          supabase.from("payouts").select("created_at, amount").eq("user_id", user.id).gte("created_at", startDate).lte("created_at", endDate),
        ]);

        const daysMap: Record<string, CalendarDay> = {};
        const cursor = new Date(start);
        while (cursor <= end) {
          const dateKey = cursor.toISOString().split('T')[0];
          daysMap[dateKey] = { date: dateKey, expenses: 0, income: 0, payout: 0 };
          cursor.setDate(cursor.getDate() + 1);
        }

        expenseData?.forEach((item) => {
          const key = item.spent_at;
          if (daysMap[key]) daysMap[key].expenses += item.amount;
        });

        incomeData?.forEach((item) => {
          const key = item.received_at;
          if (daysMap[key]) daysMap[key].income += item.amount;
        });

        payoutData?.forEach((item) => {
          const key = item.created_at.split('T')[0];
          if (daysMap[key]) daysMap[key].payout += item.amount;
        });

        setDays(Object.values(daysMap));
      } catch (error) {
        console.error("Error loading heatmap:", error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user]);

  const rating = useMemo(() => {
    const highSpendingDays = days.filter((day) => day.expenses > 5000).length;
    if (highSpendingDays > 8) return "High spending trend";
    if (highSpendingDays > 4) return "Watch spending";
    return "Healthy discipline";
  }, [days]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Wealth Heatmap Calendar</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <p className="text-sm text-gray-400">Review daily financial behavior over the last 30 days, including expenses, income, and payout activity.</p>
        <div className="grid grid-cols-7 gap-2">
          {days.map((day) => {
            const score = day.payout > 0 ? 3 : day.income > day.expenses ? 2 : day.expenses > 0 ? 1 : 0;
            const color = score === 3 ? "bg-sky-500/70" : score === 2 ? "bg-emerald-500/60" : score === 1 ? "bg-red-500/40" : "bg-slate-700";
            return (
              <div key={day.date} className={`group rounded-2xl border border-border p-3 ${color}`}>
                <div className="text-xs font-semibold text-foreground">{new Date(day.date).getDate()}</div>
                <div className="mt-2 text-[10px] leading-tight text-gray-200">
                  {day.payout > 0 ? "Payout" : day.income > day.expenses ? "Good" : day.expenses > 0 ? "Spend" : "Quiet"}
                </div>
                <div className="mt-3 text-[10px] text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity">
                  {day.expenses > 0 && <div>Expense: {formatZAR(day.expenses)}</div>}
                  {day.income > 0 && <div>Income: {formatZAR(day.income)}</div>}
                  {day.payout > 0 && <div>Payout: {formatZAR(day.payout)}</div>}
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-3 text-sm text-gray-300">
          <div className="rounded-full bg-slate-800 px-3 py-2">Green: positive day</div>
          <div className="rounded-full bg-red-800 px-3 py-2">Red: higher spending</div>
          <div className="rounded-full bg-sky-800 px-3 py-2">Blue: payout day</div>
        </div>
        <div className="rounded-3xl border border-border bg-background/80 p-4 text-sm text-gray-300">
          <p className="font-medium text-foreground">Heatmap insights</p>
          <p className="mt-2">{rating}. Stay aware of spending spikes and payout momentum in your daily cash flow.</p>
        </div>
      </CardContent>
    </Card>
  );
}
