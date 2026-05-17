"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/utils/supabase/client";
import { useAuth } from "@/components/auth-provider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/stat-card";
import { Wallet, TrendingUp, TrendingDown, Clock, AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { AccountEquityChart } from "@/components/capital/account-equity-chart";
import { calculateAccountPayouts } from "@/utils/payouts";

export default function AccountDashboardPage() {
  const { user } = useAuth();
  const params = useParams();
  const accountId = params.accountId as string;

  const [account, setAccount] = useState<any>(null);
  const [trades, setTrades] = useState<any[]>([]);
  const [accountPayouts, setAccountPayouts] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAccountData() {
      if (!user || !accountId) return;

      const { data: accountData } = await supabase
        .from('capital_accounts')
        .select('*')
        .eq('id', accountId)
        .eq('user_id', user.id)
        .single();

      if (accountData) {
        setAccount(accountData);
      }

      const { data: tradesData } = await supabase
        .from('trades')
        .select('*')
        .eq('account_id', accountId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (tradesData) {
        setTrades(tradesData);
      }

      // Fetch account payouts
      const payouts = await calculateAccountPayouts(supabase, accountId);
      setAccountPayouts(payouts);

      setLoading(false);
    }

    loadAccountData();

    // Setup realtime subscriptions
    const tradesChannel = supabase.channel('realtime-account-trades')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trades', filter: `account_id=eq.${accountId}` }, () => {
        loadAccountData();
      })
      .subscribe();

    const payoutsChannel = supabase.channel('realtime-account-payouts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payouts', filter: `account_id=eq.${accountId}` }, () => {
        loadAccountData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(tradesChannel);
      supabase.removeChannel(payoutsChannel);
    };
  }, [user, accountId]);

  // Calculate Metrics
  const metrics = useMemo(() => {
    if (!trades.length) return null;

    const wins = trades.filter(t => t.result === 'win');
    const losses = trades.filter(t => t.result === 'loss');
    
    const winRate = (wins.length / trades.length) * 100;
    
    const totalProfit = wins.reduce((sum, t) => sum + Number(t.pnl), 0);
    const totalLoss = Math.abs(losses.reduce((sum, t) => sum + Number(t.pnl), 0));
    const profitFactor = totalLoss === 0 ? totalProfit : totalProfit / totalLoss;

    const avgWin = wins.length ? totalProfit / wins.length : 0;
    const avgLoss = losses.length ? totalLoss / losses.length : 0;

    const totalLots = trades.reduce((sum, t) => sum + Number(t.lot_size), 0);

    // Calculate highest profit day
    const tradesByDay = trades.reduce((acc, t) => {
      const date = new Date(t.created_at).toLocaleDateString();
      acc[date] = (acc[date] || 0) + Number(t.pnl);
      return acc;
    }, {} as Record<string, number>);

    const highestProfitDay = Object.values(tradesByDay).length > 0 ? Math.max(...Object.values(tradesByDay) as number[]) : 0;

    // Calculate 24hr PNL
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const last24hTrades = trades.filter(t => new Date(t.created_at) > yesterday);
    const pnl24h = last24hTrades.reduce((sum, t) => sum + Number(t.pnl), 0);

    return {
      winRate,
      profitFactor,
      avgWin,
      avgLoss,
      totalLots,
      highestProfitDay,
      pnl24h
    };
  }, [trades]);

  if (loading) return <div className="p-8 text-gray-400 animate-pulse">Loading secure environment...</div>;

  if (!account) return (
    <div className="p-8 text-center text-gray-400">
      <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-gray-500" />
      <h2 className="text-xl font-bold text-foreground mb-2">Account Not Found</h2>
      <p>This account does not exist or you do not have permission to view it.</p>
      <Link href="/capital">
        <Button className="mt-4">Back to Capital Manager</Button>
      </Link>
    </div>
  );

  const startingBalance = Number(account.account_size) || 0;
  const currentBalance = Number(account.balance);
  const overallPnL = currentBalance - startingBalance;
  const isProfitable = overallPnL >= 0;

  // Risk Calculations (Mock rule: 10% max drawdown)
  const maxLossPermitted = startingBalance * 0.10;
  const currentDrawdown = overallPnL < 0 ? Math.abs(overallPnL) : 0;
  const remainingLoss = Math.max(0, maxLossPermitted - currentDrawdown);
  const drawdownPercentage = startingBalance ? (currentDrawdown / startingBalance) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-bold text-foreground">{account.account_name}</h1>
            <span className={`px-2.5 py-1 text-xs font-bold uppercase rounded-full border ${account.account_type === 'funded' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' : 'bg-green-500/10 text-green-400 border-green-500/30'}`}>
              {account.account_type}
            </span>
          </div>
          <p className="text-gray-400 text-sm flex items-center gap-2">
            <ShieldAlert className="w-4 h-4" /> {account.platform || 'Platform not specified'}
          </p>
        </div>
        <Link href="/tracker">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20">
            Log New Trade
          </Button>
        </Link>
      </div>

      {/* Top Stats Grid */}
      <div className="grid gap-4 md:grid-cols-5">
        <StatCard
          title="Current Balance"
          value={`$${currentBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          icon={Wallet}
        />
        <StatCard
          title="Overall PnL"
          value={`${isProfitable ? '+' : ''}$${overallPnL.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          icon={isProfitable ? TrendingUp : TrendingDown}
          trend={isProfitable ? 'up' : 'down'}
        />
        <StatCard
          title="24hr PnL"
          value={`${metrics && metrics.pnl24h >= 0 ? '+' : ''}$${(metrics?.pnl24h || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          icon={Clock}
          trend={metrics && metrics.pnl24h >= 0 ? 'up' : 'down'}
        />
        <StatCard
          title="Total Trades"
          value={trades.length.toString()}
          icon={CheckCircle2}
        />
        <StatCard
          title="Total Payouts"
          value={`$${accountPayouts.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          icon={TrendingDown}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Chart & Log Column */}
        <div className="lg:col-span-2 space-y-6">
          <AccountEquityChart trades={trades} startingBalance={startingBalance} />
          
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle>Recent Trades</CardTitle>
              <CardDescription>Performance history specifically for this account.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-400 bg-background/50 border-b border-border uppercase">
                    <tr>
                      <th className="px-4 py-3 font-medium">Date</th>
                      <th className="px-4 py-3 font-medium">Pair</th>
                      <th className="px-4 py-3 font-medium">Lots</th>
                      <th className="px-4 py-3 font-medium">Result</th>
                      <th className="px-4 py-3 font-medium text-right">PnL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trades.slice(0, 10).map(trade => (
                      <tr key={trade.id} className="border-b border-border/50 hover:bg-white/[0.02]">
                        <td className="px-4 py-3 text-gray-400">{new Date(trade.created_at).toLocaleDateString()}</td>
                        <td className="px-4 py-3 font-medium text-foreground">{trade.pair}</td>
                        <td className="px-4 py-3 text-gray-400">{trade.lot_size}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-bold uppercase ${trade.result === 'win' ? 'text-blue-500' : trade.result === 'loss' ? 'text-red-500' : 'text-gray-500'}`}>
                            {trade.result}
                          </span>
                        </td>
                        <td className={`px-4 py-3 text-right font-medium ${trade.pnl > 0 ? 'text-blue-500' : trade.pnl < 0 ? 'text-red-500' : 'text-gray-400'}`}>
                          {trade.pnl > 0 ? '+' : ''}{trade.pnl}
                        </td>
                      </tr>
                    ))}
                    {trades.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-gray-500">No trades recorded for this account.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Risk & Metrics Sidebar */}
        <div className="space-y-6">
          <Card className="border-border bg-card">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Risk Management</CardTitle>
              <CardDescription>Drawdown and limits</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">Account Size</span>
                  <span className="font-bold text-foreground">${startingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">Max Permitted Loss (10%)</span>
                  <span className="font-bold text-red-400">-${maxLossPermitted.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
              <div className="pt-2 border-t border-border">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">Remaining Loss</span>
                  <span className={`font-bold ${remainingLoss < maxLossPermitted * 0.2 ? 'text-red-500' : 'text-green-500'}`}>
                    ${remainingLoss.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="h-2 w-full bg-background rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${drawdownPercentage > 8 ? 'bg-red-500' : drawdownPercentage > 5 ? 'bg-yellow-500' : 'bg-blue-500'}`} 
                    style={{ width: `${Math.min(100, (currentDrawdown / maxLossPermitted) * 100)}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Advanced Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-1 border-b border-border/50">
                  <span className="text-sm text-gray-400">Win Rate</span>
                  <span className="font-bold text-foreground">{metrics ? metrics.winRate.toFixed(1) : 0}%</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-border/50">
                  <span className="text-sm text-gray-400">Profit Factor</span>
                  <span className="font-bold text-foreground">{metrics ? metrics.profitFactor.toFixed(2) : 0}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-border/50">
                  <span className="text-sm text-gray-400">Average Win</span>
                  <span className="font-bold text-blue-500">${metrics ? metrics.avgWin.toLocaleString(undefined, { minimumFractionDigits: 2 }) : 0}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-border/50">
                  <span className="text-sm text-gray-400">Average Loss</span>
                  <span className="font-bold text-red-500">-${metrics ? metrics.avgLoss.toLocaleString(undefined, { minimumFractionDigits: 2 }) : 0}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-border/50">
                  <span className="text-sm text-gray-400">Best Day</span>
                  <span className="font-bold text-blue-500">${metrics ? metrics.highestProfitDay.toLocaleString(undefined, { minimumFractionDigits: 2 }) : 0}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-sm text-gray-400">Total Lots Traded</span>
                  <span className="font-bold text-foreground">{metrics ? metrics.totalLots.toFixed(2) : 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
