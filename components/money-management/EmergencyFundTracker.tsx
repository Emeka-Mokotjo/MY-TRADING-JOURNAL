"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/utils/supabase/client";
import { useAuth } from "@/components/auth-provider";
import { formatZAR, parseZAR } from "@/utils/currency";
import toast from "react-hot-toast";

interface EmergencyFund {
  id: string;
  current_balance: number;
  target_balance: number;
  created_at: string;
}

interface EmergencyFundTrackerProps {
  onDataChange: () => void;
}

export function EmergencyFundTracker({ onDataChange }: EmergencyFundTrackerProps) {
  const { user } = useAuth();
  const [fund, setFund] = useState<EmergencyFund | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ current_balance: "", target_balance: "" });
  const [monthlyExpenses, setMonthlyExpenses] = useState(0);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const [{ data: fundData, error: fundError }, { data: expenseData, error: expenseError }] = await Promise.all([
        supabase.from("emergency_fund_targets").select("*").eq("user_id", user.id).single(),
        supabase.from("expense_entries")
          .select("amount")
          .eq("user_id", user.id)
          .gte("spent_at", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0])
          .lte("spent_at", new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]),
      ]);

      if (fundError && fundError.code !== "PGRST116") {
        throw fundError;
      }
      if (expenseError) throw expenseError;

      setFund(fundData || null);
      setMonthlyExpenses(expenseData?.reduce((sum, item) => sum + item.amount, 0) || 0);
      setFormData({
        current_balance: fundData ? formatZAR(fundData.current_balance) : "",
        target_balance: fundData ? formatZAR(fundData.target_balance) : "",
      });
    } catch (error) {
      console.error("Error fetching emergency fund data:", error);
      toast.error("Unable to load emergency fund tracker");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const monthsCovered = fund && monthlyExpenses > 0 ? fund.current_balance / monthlyExpenses : 0;
  const status = monthsCovered >= 6 ? "Strong" : monthsCovered >= 3 ? "Stable" : "Weak";
  const progress = fund ? Math.min(100, (fund.current_balance / Math.max(1, fund.target_balance)) * 100) : 0;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) return;

    const currentBalance = parseZAR(formData.current_balance);
    const targetBalance = parseZAR(formData.target_balance);

    if (targetBalance <= 0) {
      toast.error("Target balance must be greater than 0");
      return;
    }
    if (currentBalance < 0) {
      toast.error("Current balance cannot be negative");
      return;
    }

    const record = {
      user_id: user.id,
      current_balance: currentBalance,
      target_balance: targetBalance,
    };

    try {
      if (fund) {
        const { error } = await supabase
          .from("emergency_fund_targets")
          .update(record)
          .eq("id", fund.id);
        if (error) throw error;
        toast.success("Emergency fund updated");
      } else {
        const { error } = await supabase
          .from("emergency_fund_targets")
          .insert(record);
        if (error) throw error;
        toast.success("Emergency fund tracked");
      }
      fetchData();
      onDataChange();
    } catch (error) {
      console.error("Error saving emergency fund:", error);
      toast.error("Failed to save emergency fund");
    }
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
        <CardTitle>Emergency Fund Tracker</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-3xl border border-border bg-card/80 p-5">
            <p className="text-sm text-gray-400">Target coverage for survival cash.</p>
            <p className="mt-3 text-3xl font-semibold text-foreground">{formatZAR(fund?.current_balance || 0)}</p>
            <p className="text-sm text-gray-400">of {formatZAR(fund?.target_balance || 0)} target</p>
            <div className="mt-4 rounded-full bg-slate-800 h-3 overflow-hidden">
              <div className="h-3 bg-emerald-400" style={{ width: `${progress}%` }} />
            </div>
            <div className="mt-3 flex items-center justify-between text-sm text-gray-300">
              <span>{progress.toFixed(1)}% complete</span>
              <span>{status}</span>
            </div>
          </div>
          <div className="rounded-3xl border border-border bg-card/80 p-5">
            <p className="text-sm text-gray-400">Monthly expense burn this period</p>
            <p className="mt-3 text-3xl font-semibold text-foreground">{formatZAR(monthlyExpenses)}</p>
            <p className="text-sm text-gray-400">Months covered: {monthsCovered.toFixed(1)}</p>
            <div className="mt-3 rounded-full bg-slate-800 h-3 overflow-hidden">
              <div className={`h-3 ${status === "Strong" ? "bg-green-400" : status === "Stable" ? "bg-yellow-400" : "bg-red-400"}`} style={{ width: `${Math.min(monthsCovered / 6, 1) * 100}%` }} />
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="rounded-3xl border border-border bg-background/80 p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="current_balance">Current Reserve (ZAR)</Label>
              <Input
                id="current_balance"
                value={formData.current_balance}
                onChange={(e) => setFormData({ ...formData, current_balance: e.target.value })}
                placeholder="R75,000.00"
                required
              />
            </div>
            <div>
              <Label htmlFor="target_balance">Target Fund (ZAR)</Label>
              <Input
                id="target_balance"
                value={formData.target_balance}
                onChange={(e) => setFormData({ ...formData, target_balance: e.target.value })}
                placeholder="R200,000.00"
                required
              />
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <Button type="submit">Save Emergency Plan</Button>
            <Button type="button" variant="outline" onClick={() => setFormData({ current_balance: fund ? formatZAR(fund.current_balance) : "", target_balance: fund ? formatZAR(fund.target_balance) : "" })}>Reset</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
