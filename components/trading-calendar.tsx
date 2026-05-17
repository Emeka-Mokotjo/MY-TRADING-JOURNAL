"use client";

import { useState, useEffect, useMemo } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isSameMonth, isSameDay, addMonths, subMonths, parseISO, startOfDay, endOfDay } from "date-fns";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { supabase } from "@/utils/supabase/client";
import { useAuth } from "@/components/auth-provider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/cn";

interface Trade {
  id: string;
  pair: string;
  lot_size: number;
  result: string;
  pnl: number;
  created_at: string;
}

interface DailyAgg {
  date: Date;
  totalPnL: number;
  tradeCount: number;
  status: "profit" | "loss" | "neutral";
  trades: Trade[];
}

export function TradingCalendar() {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<DailyAgg | null>(null);

  // Fetch trades for the current viewed month
  useEffect(() => {
    async function fetchMonthTrades() {
      if (!user) return;
      setLoading(true);

      const start = startOfMonth(currentDate).toISOString();
      const end = endOfMonth(currentDate).toISOString();

      const { data } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', start)
        .lte('created_at', end);

      if (data) {
        setTrades(data);
      }
      setLoading(false);
    }
    
    fetchMonthTrades();

    const channel = supabase.channel('realtime-calendar-trades')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trades', filter: `user_id=eq.${user?.id}` }, () => {
        fetchMonthTrades();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, currentDate]);

  // Aggregate trades by day
  const dailyData = useMemo(() => {
    const agg: Record<string, DailyAgg> = {};

    trades.forEach(trade => {
      const dateStr = trade.created_at.split('T')[0];
      if (!agg[dateStr]) {
        agg[dateStr] = {
          date: parseISO(dateStr),
          totalPnL: 0,
          tradeCount: 0,
          status: "neutral",
          trades: []
        };
      }
      
      agg[dateStr].totalPnL += Number(trade.pnl);
      agg[dateStr].tradeCount += 1;
      agg[dateStr].trades.push(trade);
    });

    // Determine status
    Object.keys(agg).forEach(key => {
      if (agg[key].totalPnL > 0) agg[key].status = "profit";
      else if (agg[key].totalPnL < 0) agg[key].status = "loss";
    });

    return agg;
  }, [trades]);

  // Generate calendar grid
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const dateFormat = "d";
  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date());

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle>Trading Calendar</CardTitle>
            <CardDescription>Daily performance summary. Click a day to view trades.</CardDescription>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-400 mr-4 hidden md:flex">
              <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Profit</div>
              <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span> Loss</div>
            </div>
            <div className="flex items-center gap-2 bg-card border border-border rounded-lg p-1">
              <Button variant="ghost" size="icon" onClick={prevMonth} className="h-8 w-8">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="w-32 text-center font-medium">
                {format(currentDate, "MMMM yyyy")}
              </div>
              <Button variant="ghost" size="icon" onClick={nextMonth} className="h-8 w-8">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <Button variant="outline" size="sm" onClick={goToToday}>Today</Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Weekday headers */}
          <div className="grid grid-cols-7 mb-2">
            {weekDays.map(day => (
              <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {days.map((day, i) => {
              const dateKey = format(day, "yyyy-MM-dd");
              const dayData = dailyData[dateKey];
              const isCurrentMonth = isSameMonth(day, monthStart);
              const isToday = isSameDay(day, new Date());
              
              let bgColorClass = "bg-card hover:bg-card/80 border-border";
              if (dayData) {
                if (dayData.status === "profit") bgColorClass = "bg-primary/10 hover:bg-primary/20 border-primary/30";
                if (dayData.status === "loss") bgColorClass = "bg-danger/10 hover:bg-danger/20 border-danger/30";
              }

              return (
                <div 
                  key={day.toString()} 
                  onClick={() => dayData && setSelectedDay(dayData)}
                  className={cn(
                    "min-h-[80px] p-2 rounded-lg border transition-all relative group flex flex-col",
                    !isCurrentMonth ? "opacity-30 pointer-events-none bg-background border-transparent" : bgColorClass,
                    dayData ? "cursor-pointer" : "",
                    isToday ? "ring-2 ring-foreground/20 ring-offset-2 ring-offset-background" : ""
                  )}
                >
                  <span className={cn(
                    "text-xs font-semibold mb-1",
                    isToday ? "text-primary" : "text-gray-400"
                  )}>
                    {format(day, dateFormat)}
                  </span>
                  
                  {dayData && (
                    <div className="flex-1 flex flex-col justify-center items-center text-center">
                      <span className={cn(
                        "font-bold text-sm",
                        dayData.status === "profit" ? "text-success" : 
                        dayData.status === "loss" ? "text-danger" : "text-foreground"
                      )}>
                        {dayData.totalPnL > 0 ? "+" : ""}${dayData.totalPnL.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}
                      </span>
                      <span className="text-[10px] text-gray-500 mt-0.5">
                        {dayData.tradeCount} trade{dayData.tradeCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Day Details Modal */}
      {selectedDay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-4 border-b border-border flex justify-between items-center bg-background/50">
              <div>
                <h3 className="font-bold text-lg">{format(selectedDay.date, "MMMM do, yyyy")}</h3>
                <p className={cn(
                  "text-sm font-medium",
                  selectedDay.status === "profit" ? "text-success" : 
                  selectedDay.status === "loss" ? "text-danger" : "text-gray-400"
                )}>
                  Net: {selectedDay.totalPnL > 0 ? "+" : ""}${selectedDay.totalPnL.toLocaleString(undefined, {minimumFractionDigits: 2})}
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSelectedDay(null)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="p-4 overflow-y-auto flex-1 space-y-3">
              {selectedDay.trades.map(trade => (
                <div key={trade.id} className="flex items-center justify-between p-3 rounded-lg bg-background/80 border border-border">
                  <div>
                    <p className="font-medium text-foreground">{trade.pair}</p>
                    <p className="text-xs text-gray-400">{trade.lot_size} Lots • {new Date(trade.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                  </div>
                  <div className={cn(
                    "font-bold",
                    Number(trade.pnl) >= 0 ? "text-success" : "text-danger"
                  )}>
                    {Number(trade.pnl) >= 0 ? "+" : ""}${Number(trade.pnl).toLocaleString(undefined, {minimumFractionDigits: 2})}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
