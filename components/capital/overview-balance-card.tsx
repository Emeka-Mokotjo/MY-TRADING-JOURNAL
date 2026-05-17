"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { AnimatedValue } from "@/components/ui/AnimatedValue";
import { supabase } from "@/utils/supabase/client";
import { useAuth } from "@/components/auth-provider";
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { calculateTotalPayouts } from "@/utils/payouts";
import { getTotalExpenses } from "@/utils/finance";

export function OverviewBalanceCard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  
  const [overviewBalance, setOverviewBalance] = useState(0);
  const [totalPnL, setTotalPnL] = useState(0);
  const [totalPayouts, setTotalPayouts] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [percentageGain, setPercentageGain] = useState(0);

  const fetchData = useCallback(async () => {
    if (!user) return;

    // 1. Fetch Accounts
    const { data: accountsData } = await supabase
      .from('capital_accounts')
      .select('account_size, balance')
      .eq('user_id', user.id);

    // 2. Fetch Trades
    const { data: tradesData } = await supabase
      .from('trades')
      .select('pnl')
      .eq('user_id', user.id);

    // 3. Fetch Total Payouts
    const payouts = await calculateTotalPayouts(supabase, user.id);

    // 4. Fetch Total Expenses
    const expenses = await getTotalExpenses(supabase, user.id);

    if (accountsData) {
      let totalStartingCapital = 0;
      
      // Calculate starting capital based on account_size (fallback to balance if 0 or null)
      accountsData.forEach(account => {
        const size = Number(account.account_size);
        const bal = Number(account.balance);
        totalStartingCapital += (size > 0 ? size : bal);
      });

      // Calculate Total PnL from trades
      let pnl = 0;
      if (tradesData) {
        pnl = tradesData.reduce((sum, trade) => sum + Number(trade.pnl), 0);
      }

      // Calculate live overview balance: starting_capital + pnl - payouts - expenses
      const liveOverviewBalance = totalStartingCapital + pnl - payouts - expenses;
      let percentGain = 0;
      
      if (totalStartingCapital > 0) {
        percentGain = (pnl / totalStartingCapital) * 100;
      }

      setOverviewBalance(liveOverviewBalance);
      setTotalPnL(pnl);
      setTotalPayouts(payouts);
      setTotalExpenses(expenses);
      setPercentageGain(percentGain);
    }
    
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchData();

    if (!user) return;

    // Setup Realtime subscriptions
    const channel = supabase.channel('realtime-overview')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trades', filter: `user_id=eq.${user.id}` }, () => {
        fetchData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'capital_accounts', filter: `user_id=eq.${user.id}` }, () => {
        fetchData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payouts', filter: `user_id=eq.${user.id}` }, () => {
        fetchData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses', filter: `user_id=eq.${user.id}` }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchData]);

  if (loading) {
    return (
      <Card className="relative overflow-hidden border-border bg-card/80 backdrop-blur-xl animate-pulse">
        <CardContent className="p-8 h-32">
          <div className="h-4 bg-gray-700 w-1/4 rounded mb-4"></div>
          <div className="h-8 bg-gray-600 w-1/3 rounded"></div>
        </CardContent>
      </Card>
    );
  }

  const isProfitable = totalPnL >= 0;

  return (
    <Card className={`relative overflow-hidden transition-all duration-300 border-t-4 ${isProfitable ? 'border-t-blue-500 shadow-[0_0_40px_-15px_rgba(59,130,246,0.3)]' : 'border-t-red-500 shadow-[0_0_40px_-15px_rgba(239,68,68,0.3)]'} bg-card`}>
      {/* Background Gradient Effect */}
      <div className={`absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full opacity-[0.03] blur-3xl pointer-events-none ${isProfitable ? 'bg-blue-500' : 'bg-red-500'}`} />
      
      <CardContent className="p-8">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h2 className="text-sm font-semibold tracking-wider text-gray-400 uppercase flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-gray-500" />
              Overview Balance
            </h2>
            <div className="flex items-end gap-4">
              <span className="text-4xl md:text-5xl font-black tracking-tight text-foreground">
                <AnimatedValue
                  value={overviewBalance}
                  format={(current) =>
                    `$${current.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  }
                />
              </span>
              
              <div className={`flex flex-col mb-1 ${isProfitable ? 'text-blue-500' : 'text-red-500'}`}>
                <div className="flex items-center gap-1 font-bold">
                  {isProfitable ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                  <span className="text-lg">
                    {isProfitable ? '+' : ''}
                    <AnimatedValue
                      value={totalPnL}
                      format={(current) =>
                        `$${current.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      }
                    />
                  </span>
                </div>
                <span className={`text-xs font-semibold ${isProfitable ? 'text-blue-500/80' : 'text-red-500/80'} bg-background/50 px-2 py-0.5 rounded-full inline-block mt-0.5 border ${isProfitable ? 'border-blue-500/20' : 'border-red-500/20'}`}>
                  {isProfitable ? '+' : ''}
                  <AnimatedValue
                    value={percentageGain}
                    format={(current) => current.toFixed(2)}
                  />
                  % All-Time
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
