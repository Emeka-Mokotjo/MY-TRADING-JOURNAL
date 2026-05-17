"use client";

import { useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface Trade {
  id: string;
  created_at: string;
  pnl: number;
}

interface AccountEquityChartProps {
  trades: Trade[];
  startingBalance: number;
}

export function AccountEquityChart({ trades, startingBalance }: AccountEquityChartProps) {
  const data = useMemo(() => {
    // Sort trades oldest to newest
    const sortedTrades = [...trades].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    
    let currentEquity = startingBalance;
    const chartData = sortedTrades.map(trade => {
      currentEquity += Number(trade.pnl);
      return {
        date: new Date(trade.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        equity: currentEquity,
        pnl: Number(trade.pnl)
      };
    });

    // Add initial point
    return [
      { date: 'Start', equity: startingBalance, pnl: 0 },
      ...chartData
    ];
  }, [trades, startingBalance]);

  const minEquity = Math.min(...data.map(d => d.equity));
  const maxEquity = Math.max(...data.map(d => d.equity));
  
  // Calculate buffer for Y-axis bounds
  const buffer = (maxEquity - minEquity) * 0.1 || startingBalance * 0.05;
  const domainMin = Math.max(0, minEquity - buffer);
  const domainMax = maxEquity + buffer;

  const isProfitable = data[data.length - 1]?.equity >= startingBalance;

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-2">
        <CardTitle>Equity Curve</CardTitle>
        <CardDescription>Cumulative account performance over time</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={isProfitable ? "#ffffff" : "#6b7280"} stopOpacity={0.15}/>
                  <stop offset="95%" stopColor={isProfitable ? "#ffffff" : "#6b7280"} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="date" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6b7280', fontSize: 12 }}
                dy={10}
              />
              <YAxis 
                domain={[domainMin, domainMax]} 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6b7280', fontSize: 12 }}
                tickFormatter={(val) => `$${val.toLocaleString()}`}
                dx={-10}
              />
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1f1f1f" opacity={0.8} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f0f0f', borderColor: '#1f1f1f', color: '#fff', borderRadius: '8px' }}
                itemStyle={{ color: '#fff' }}
                formatter={(value: number) => [`$${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 'Equity']}
                labelStyle={{ color: '#9ca3af', marginBottom: '4px' }}
              />
              <Area 
                type="monotone" 
                dataKey="equity" 
                stroke={isProfitable ? "#ffffff" : "#6b7280"} 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorEquity)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
