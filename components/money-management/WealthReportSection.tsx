"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/utils/supabase/client";
import { useAuth } from "@/components/auth-provider";
import { formatZAR } from "@/utils/currency";
import toast from "react-hot-toast";

interface WealthReportSectionProps {
  financialHealthScore: number;
}

export function WealthReportSection({ financialHealthScore }: WealthReportSectionProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    totalPayouts: 0,
    savingsGrowth: 0,
    netWorthGrowth: 0,
    retentionRate: 0,
  });

  const fetchReport = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

      const [{ data: incomeData }, { data: expenseData }, { data: payoutData }, { data: savingsData }, { data: assetData }, { data: liabilityData }] = await Promise.all([
        supabase.from("income_entries").select("amount").eq("user_id", user.id).gte("received_at", firstDay).lte("received_at", lastDay),
        supabase.from("expense_entries").select("amount").eq("user_id", user.id).gte("spent_at", firstDay).lte("spent_at", lastDay),
        supabase.from("payouts").select("amount").eq("user_id", user.id).gte("created_at", firstDay).lte("created_at", lastDay),
        supabase.from("savings_goals").select("current_amount, target_amount").eq("user_id", user.id),
        supabase.from("assets").select("value").eq("user_id", user.id),
        supabase.from("liabilities").select("value").eq("user_id", user.id),
      ]);

      const totalIncome = incomeData?.reduce((sum, item) => sum + item.amount, 0) || 0;
      const totalExpenses = expenseData?.reduce((sum, item) => sum + item.amount, 0) || 0;
      const totalPayouts = payoutData?.reduce((sum, item) => sum + item.amount, 0) || 0;
      const totalSavings = savingsData?.reduce((sum, item) => sum + item.current_amount, 0) || 0;
      const totalTargets = savingsData?.reduce((sum, item) => sum + item.target_amount, 0) || 0;
      const assetValue = assetData?.reduce((sum, item) => sum + item.value, 0) || 0;
      const liabilityValue = liabilityData?.reduce((sum, item) => sum + item.value, 0) || 0;
      const netWorth = assetValue - liabilityValue;

      setReport({
        totalIncome,
        totalExpenses,
        totalPayouts,
        savingsGrowth: totalTargets > 0 ? (totalSavings / totalTargets) * 100 : 0,
        netWorthGrowth: netWorth,
        retentionRate: totalPayouts > 0 ? (netWorth / totalPayouts) * 100 : 0,
      });
    } catch (error) {
      console.error("Error fetching wealth report:", error);
      toast.error("Failed to generate wealth report");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [user]);

  const exportReport = () => {
    window.print();
  };

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
        <CardTitle>Monthly Wealth Report</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-3xl border border-border bg-background/80 p-4">
            <p className="text-sm text-gray-400">Total Income</p>
            <p className="mt-2 text-2xl font-semibold text-foreground">{formatZAR(report.totalIncome)}</p>
          </div>
          <div className="rounded-3xl border border-border bg-background/80 p-4">
            <p className="text-sm text-gray-400">Total Expenses</p>
            <p className="mt-2 text-2xl font-semibold text-foreground">{formatZAR(report.totalExpenses)}</p>
          </div>
          <div className="rounded-3xl border border-border bg-background/80 p-4">
            <p className="text-sm text-gray-400">Payouts Received</p>
            <p className="mt-2 text-2xl font-semibold text-foreground">{formatZAR(report.totalPayouts)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-3xl border border-border bg-card/80 p-4">
            <p className="text-sm text-gray-400">Savings Growth</p>
            <p className="mt-2 text-3xl font-semibold text-foreground">{report.savingsGrowth.toFixed(1)}%</p>
            <p className="mt-2 text-sm text-gray-400">Progress toward savings targets across your wealth goals.</p>
          </div>
          <div className="rounded-3xl border border-border bg-card/80 p-4">
            <p className="text-sm text-gray-400">Retention Rate</p>
            <p className="mt-2 text-3xl font-semibold text-foreground">{report.retentionRate.toFixed(1)}%</p>
            <p className="mt-2 text-sm text-gray-400">Keep more of your trading profits in long-term wealth.</p>
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-background/80 p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Financial Health Snapshot</h3>
              <p className="text-sm text-gray-400">Your wealth score is built into each monthly report.</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-semibold text-foreground">{financialHealthScore.toFixed(0)}</p>
              <p className="text-sm text-gray-400">Health Score</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button onClick={exportReport}>Export PDF</Button>
            <Button variant="outline" onClick={exportReport}>Printable View</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
