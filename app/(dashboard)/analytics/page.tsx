"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from "@/utils/supabase/client";
import { useAuth } from "@/components/auth-provider";

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState({
    bestDay: { name: '-', pnl: 0 },
    worstDay: { name: '-', pnl: 0 },
    topPair: { name: '-', count: 0 },
    dailyData: [] as any[],
  });

  useEffect(() => {
    async function fetchAnalytics() {
      if (!user) return;

      const { data: trades } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', user.id);

      if (trades && trades.length > 0) {
        // Calculate Top Pair
        const pairCounts: Record<string, number> = {};
        trades.forEach(t => {
          pairCounts[t.pair] = (pairCounts[t.pair] || 0) + 1;
        });
        const topPairEntry = Object.entries(pairCounts).sort((a, b) => b[1] - a[1])[0];

        // Group PnL by day of week
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const pnlByDay: Record<string, number> = {
          'Mon': 0, 'Tue': 0, 'Wed': 0, 'Thu': 0, 'Fri': 0,
        };

        trades.forEach(t => {
          const date = new Date(t.created_at);
          const dayName = days[date.getDay()];
          if (pnlByDay[dayName] !== undefined) {
            pnlByDay[dayName] += Number(t.pnl);
          } else {
            pnlByDay[dayName] = Number(t.pnl);
          }
        });

        const dailyData = Object.keys(pnlByDay).map(day => ({
          day,
          pnl: pnlByDay[day],
        }));

        // Find Best/Worst Day
        const sortedDays = [...dailyData].sort((a, b) => b.pnl - a.pnl);
        const bestDay = sortedDays[0] || { day: '-', pnl: 0 };
        const worstDay = sortedDays[sortedDays.length - 1] || { day: '-', pnl: 0 };

        setAnalytics({
          bestDay: { name: bestDay.day, pnl: bestDay.pnl },
          worstDay: { name: worstDay.day, pnl: worstDay.pnl },
          topPair: { name: topPairEntry[0], count: topPairEntry[1] },
          dailyData,
        });
      }

      setLoading(false);
    }
    
    fetchAnalytics();

    const channel = supabase.channel('realtime-analytics-trades')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trades', filter: `user_id=eq.${user?.id}` }, () => {
        fetchAnalytics();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  if (loading) return <div className="p-8 text-gray-400">Loading analytics...</div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Analytics</h1>
        <p className="text-gray-400">Deep dive into your trading performance.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Best Trading Day</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{analytics.bestDay.name}</div>
            <p className="text-sm text-gray-400 mt-1">{analytics.bestDay.pnl >= 0 ? '+' : ''}${analytics.bestDay.pnl.toLocaleString(undefined, {minimumFractionDigits: 2})} Net Profit</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Worst Trading Day</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-400">{analytics.worstDay.name}</div>
            <p className="text-sm text-gray-400 mt-1">{analytics.worstDay.pnl >= 0 ? '+' : ''}${analytics.worstDay.pnl.toLocaleString(undefined, {minimumFractionDigits: 2})} Net Loss</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Most Traded Pair</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{analytics.topPair.name}</div>
            <p className="text-sm text-gray-400 mt-1">{analytics.topPair.count} Total Trades</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daily Performance</CardTitle>
          <CardDescription>Your cumulative profit and loss broken down by day of the week.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" vertical={false} />
                <XAxis dataKey="day" stroke="#525252" />
                <YAxis stroke="#525252" />
                <Tooltip 
                  cursor={{ fill: '#1a1a1a' }}
                  contentStyle={{ backgroundColor: '#0f0f0f', borderColor: '#1f1f1f', color: '#ffffff' }}
                  formatter={(value: number) => [`$${value.toFixed(2)}`, 'PnL']}
                />
                <Bar 
                  dataKey="pnl" 
                  radius={[4, 4, 0, 0]}
                >
                  {analytics.dailyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? '#ffffff' : '#4b4b4b'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
