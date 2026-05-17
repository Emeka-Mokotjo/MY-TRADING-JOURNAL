"use client";

import { useState, useEffect } from "react";
import { StatCard } from "@/components/stat-card";
import { DollarSign, TrendingUp, Target, Activity, AlertTriangle, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from "@/utils/supabase/client";
import { useAuth } from "@/components/auth-provider";
import { usePrivacy } from "@/contexts/PrivacyContext";
import { PrivacyMask } from "@/components/PrivacyMask";
import { TradingCalendar } from "@/components/trading-calendar";
import { EditTradeModal } from "@/components/edit-trade-modal";
import { calculateTotalCapital, getCapitalBreakdown } from "@/utils/capital";
import { calculateTotalPayouts } from "@/utils/payouts";
import { getTotalExpenses, getTotalExternalIncome } from "@/utils/finance";
import { Edit2, Trash2, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import toast from "react-hot-toast";

export default function DashboardPage() {
  const { user, firstName } = useAuth();
  const { privacyMode } = usePrivacy();
  const [loading, setLoading] = useState(true);
  const [totalCapital, setTotalCapital] = useState(0);
  const [totalPayouts, setTotalPayouts] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [externalIncome, setExternalIncome] = useState(0);
  const [netWealth, setNetWealth] = useState(0);
  const [hasCapital, setHasCapital] = useState(false);
  const [metrics, setMetrics] = useState({
    balance: 0,
    dailyPnl: 0,
    winRate: 0,
    streak: 0,
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [recentTrades, setRecentTrades] = useState<any[]>([]);
  const [editingTrade, setEditingTrade] = useState<any | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const getWelcomeMessage = () => {
    if (firstName) {
      return `Welcome back, ${firstName} 👋`;
    }
    return "Welcome back, Trader 👋";
  };

  const triggerRefresh = () => {
    setRefreshKey(prev => prev + 1);
    setEditingTrade(null);
  };

  const deleteTrade = async (id: string) => {
    if (!user) return;
    if (!window.confirm("Are you sure you want to delete this trade?")) return;

    const { error } = await supabase.from('trades').delete().eq('id', id).eq('user_id', user.id);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Trade deleted");
      triggerRefresh();
    }
  };

  useEffect(() => {
    async function loadDashboard() {
      if (!user) return;
      
      // Fetch total capital from capital_accounts
      const capital = await calculateTotalCapital(supabase, user.id);
      setTotalCapital(capital);
      setHasCapital(capital > 0);

      // Fetch total payouts
      const payouts = await calculateTotalPayouts(supabase, user.id);
      setTotalPayouts(payouts);

      // Fetch total spending and external income
      const expenses = await getTotalExpenses(supabase, user.id);
      const external = await getTotalExternalIncome(supabase, user.id);
      setTotalExpenses(expenses);
      setExternalIncome(external);
      setNetWealth(capital + external - expenses);

      // Fetch trades
      const { data: trades } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (trades) {
        // Calculate balance using total capital + PnL
        const totalPnl = trades.reduce((sum, t) => sum + Number(t.pnl), 0);
        const currentBalance = capital + totalPnl;

        // Calculate win rate
        const wins = trades.filter(t => t.result === 'win').length;
        const winRate = trades.length > 0 ? Math.round((wins / trades.length) * 100) : 0;

        // Calculate daily PnL
        const today = new Date().toISOString().split('T')[0];
        const dailyPnl = trades
          .filter(t => t.created_at.startsWith(today))
          .reduce((sum, t) => sum + Number(t.pnl), 0);

        // Calculate streak
        let streak = 0;
        for (let i = trades.length - 1; i >= 0; i--) {
          if (trades[i].result === 'win') streak++;
          else if (trades[i].result === 'loss') break;
        }

        setMetrics({
          balance: currentBalance,
          dailyPnl,
          winRate,
          streak,
        });

        // Prepare chart data - start from total capital
        let rollingBalance = capital;
        const cData = trades.map((t, index) => {
          rollingBalance += Number(t.pnl);
          return {
            name: `Trade ${index + 1}`,
            balance: rollingBalance,
          };
        });
        
        // If no trades, just show current capital
        if (cData.length === 0) {
          cData.push({ name: 'Start', balance: capital });
        }

        setChartData(cData);
        
        // Recent trades
        setRecentTrades([...trades].reverse().slice(0, 5));
      }
      
      setLoading(false);
    }
    
    loadDashboard();

    // Subscribe to trade changes
    const tradesChannel = supabase.channel('realtime-dashboard-trades')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trades', filter: `user_id=eq.${user?.id}` }, () => {
        setRefreshKey(prev => prev + 1);
      })
      .subscribe();

    // Subscribe to capital changes (for real-time balance updates)
    const capitalChannel = supabase.channel('realtime-dashboard-capital')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'capital_accounts', filter: `user_id=eq.${user?.id}` }, () => {
        setRefreshKey(prev => prev + 1);
      })
      .subscribe();

    // Subscribe to payouts changes
    const payoutsChannel = supabase.channel('realtime-dashboard-payouts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payouts', filter: `user_id=eq.${user?.id}` }, () => {
        setRefreshKey(prev => prev + 1);
      })
      .subscribe();

    const externalIncomeChannel = supabase.channel('realtime-dashboard-external-income')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'external_income', filter: `user_id=eq.${user?.id}` }, () => {
        setRefreshKey(prev => prev + 1);
      })
      .subscribe();

    const expensesChannel = supabase.channel('realtime-dashboard-expenses')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses', filter: `user_id=eq.${user?.id}` }, () => {
        setRefreshKey(prev => prev + 1);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(tradesChannel);
      supabase.removeChannel(capitalChannel);
      supabase.removeChannel(payoutsChannel);
      supabase.removeChannel(externalIncomeChannel);
      supabase.removeChannel(expensesChannel);
    };
  }, [user, refreshKey]);

  if (loading) return <div className="p-8 text-gray-400">Loading dashboard...</div>;

  return (
    <div className="space-y-8">
      <section className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-[2rem] border border-white/10 bg-card/80 p-8 shadow-[0_40px_120px_-70px_rgba(0,0,0,0.85)]">
          <div className="max-w-2xl space-y-4">
            <p className="text-xs uppercase tracking-[0.32em] text-primary/80">Pro trading terminal</p>
            <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">{getWelcomeMessage()}</h1>
            <p className="text-slate-400 text-base sm:text-lg">Your elite performance dashboard engineered for structured risk, real-time edge, and cinematic trade flow.</p>
            <div className="flex flex-wrap gap-3 pt-3">
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.28em] text-slate-300">Live equity monitoring</span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.28em] text-slate-300">Realtime alerts</span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.28em] text-slate-300">Performance streak</span>
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          <div className="rounded-[1.75rem] border border-white/10 bg-card/80 p-6 shadow-[0_20px_60px_-40px_rgba(0,0,0,0.8)]">
            <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Market snapshot</p>
            <p className="mt-4 text-3xl font-semibold text-foreground">
              <PrivacyMask
                value={`$${totalCapital.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                className="inline"
              />
            </p>
            <p className="text-sm text-slate-400 mt-1">Total deployed capital</p>
          </div>
          <div className="rounded-[1.75rem] border border-white/10 bg-card/80 p-6 shadow-[0_20px_60px_-40px_rgba(0,0,0,0.8)]">
            <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Payout velocity</p>
            <p className="mt-4 text-3xl font-semibold text-foreground">
              <PrivacyMask
                value={`$${totalPayouts.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                className="inline"
              />
            </p>
            <p className="text-sm text-slate-400 mt-1">Real payouts captured</p>
          </div>
        </div>
      </section>

      {!hasCapital && (
        <div className="p-4 bg-white/5 border border-white/10 rounded-lg flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-white mb-1">No capital added yet</p>
            <p className="text-sm text-gray-400 mb-3">
              You haven't added any capital yet. Add capital accounts to start trading.
            </p>
            <Link href="/capital">
              <Button size="sm" variant="outline">
                <LinkIcon className="w-4 h-4 mr-2" />
                Go to Capital
              </Button>
            </Link>
          </div>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title="Total Balance"
          value={
            <PrivacyMask
              value={`$${metrics.balance.toLocaleString(undefined, {minimumFractionDigits: 2})}`}
              className="inline"
            />
          }
          icon={DollarSign}
        />
        <StatCard
          title="Total Wealth"
          value={
            <PrivacyMask
              value={`$${netWealth.toLocaleString(undefined, {minimumFractionDigits: 2})}`}
              className="inline"
            />
          }
          icon={DollarSign}
        />
        <StatCard
          title="Daily PnL"
          value={
            <PrivacyMask
              value={`${metrics.dailyPnl >= 0 ? '+' : ''}$${metrics.dailyPnl.toLocaleString(undefined, {minimumFractionDigits: 2})}`}
              className="inline"
            />
          }
          icon={TrendingUp}
          trendUp={metrics.dailyPnl >= 0}
          trend={metrics.dailyPnl >= 0 ? 'Profitable' : 'Loss'}
        />
        <StatCard
          title="Win Rate"
          value={`${metrics.winRate}%`}
          icon={Target}
        />
        <StatCard
          title="Current Streak"
          value={`${metrics.streak} Wins`}
          icon={Activity}
          trendUp={metrics.streak > 0}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Equity Curve</CardTitle>
            <CardDescription>Your account growth over time.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" />
                  <XAxis dataKey="name" stroke="#525252" />
                  <YAxis stroke="#525252" domain={['dataMin - 100', 'dataMax + 100']} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f0f0f', borderColor: '#1f1f1f', color: '#ffffff' }}
                  />
                  <Line type="monotone" dataKey="balance" stroke="#ffffff" strokeWidth={2} dot={{ r: 3, fill: '#ffffff' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 overflow-hidden flex flex-col">
          <CardHeader>
            <CardTitle>Recent Trades</CardTitle>
            <CardDescription>Your latest closed positions.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto">
            <div className="space-y-4">
              {recentTrades.length === 0 ? (
                <p className="text-gray-500 text-sm">No trades logged yet.</p>
              ) : (
                recentTrades.map((trade) => (
                  <div key={trade.id} className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border group hover:border-gray-600 transition-colors">
                    <div>
                      <p className="font-medium text-foreground">{trade.pair}</p>
                      <p className="text-xs text-gray-400">{trade.lot_size} Lots</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className={`font-bold ${Number(trade.pnl) >= 0 ? 'text-success' : 'text-danger'}`}>
                        <PrivacyMask
                          value={`${Number(trade.pnl) >= 0 ? '+' : ''}$${Number(trade.pnl).toLocaleString(undefined, {minimumFractionDigits: 2})}`}
                          className="inline"
                        />
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setEditingTrade(trade)} className="p-1.5 text-gray-500 hover:text-white hover:bg-white/10 rounded-md">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => deleteTrade(trade.id)} className="p-1.5 text-gray-500 hover:text-white hover:bg-white/10 rounded-md">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="pt-4">
        <TradingCalendar />
      </div>

      {editingTrade && (
        <EditTradeModal 
          trade={editingTrade} 
          onClose={() => setEditingTrade(null)} 
          onSuccess={triggerRefresh} 
        />
      )}
    </div>
  );
}
