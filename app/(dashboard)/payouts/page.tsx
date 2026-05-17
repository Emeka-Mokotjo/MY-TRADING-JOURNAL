"use client";

import { useState, useEffect, useCallback } from "react";
import { StatCard } from "@/components/stat-card";
import { DollarSign, TrendingDown, Calendar } from "lucide-react";
import { supabase } from "@/utils/supabase/client";
import { useAuth } from "@/components/auth-provider";
import { AddPayoutForm } from "@/components/capital/add-payout-form";
import { PayoutsHistory } from "@/components/PayoutsHistory";
import {
  calculateTotalPayouts,
  calculateMonthPayouts,
  getPayoutCount,
  getUserPayouts,
} from "@/utils/payouts";

interface Payout {
  id: string;
  account_id: string;
  account_name?: string;
  amount: number;
  note: string | null;
  created_at: string;
}

export default function PayoutsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [totalPayouts, setTotalPayouts] = useState(0);
  const [monthPayouts, setMonthPayouts] = useState(0);
  const [payoutCount, setPayoutCount] = useState(0);

  const fetchPayoutsData = useCallback(async () => {
    if (!user) return;

    try {
      // Fetch all payouts with account details
      const allPayouts = await getUserPayouts(supabase, user.id);
      setPayouts(allPayouts as Payout[]);

      // Calculate statistics
      const total = await calculateTotalPayouts(supabase, user.id);
      const month = await calculateMonthPayouts(supabase, user.id);
      const count = await getPayoutCount(supabase, user.id);

      setTotalPayouts(total);
      setMonthPayouts(month);
      setPayoutCount(count);
    } catch (err) {
      console.error("Error fetching payouts data:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPayoutsData();

    if (!user) return;

    // Setup realtime subscriptions
    const channel = supabase
      .channel("realtime-payouts")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "payouts",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchPayoutsData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchPayoutsData]);

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2 animate-pulse">
            Payouts & Withdrawals
          </h1>
          <p className="text-gray-400">Loading...</p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-card border border-border rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Payouts & Withdrawals</h1>
        <p className="text-gray-400">
          Track and manage money withdrawn from your trading accounts.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <StatCard
          title="Total Payouts"
          value={`$${totalPayouts.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          icon={DollarSign}
        />
        <StatCard
          title="This Month"
          value={`$${monthPayouts.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          icon={Calendar}
        />
        <StatCard
          title="Number of Withdrawals"
          value={payoutCount.toString()}
          icon={TrendingDown}
        />
      </div>

      {/* Add Form and History Layout */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Add Payout Form */}
        <div className="lg:col-span-1">
          <AddPayoutForm onPayoutAdded={fetchPayoutsData} />
        </div>

        {/* Payouts History */}
        <div className="lg:col-span-2">
          <PayoutsHistory payouts={payouts} onPayoutUpdated={fetchPayoutsData} />
        </div>
      </div>
    </div>
  );
}
