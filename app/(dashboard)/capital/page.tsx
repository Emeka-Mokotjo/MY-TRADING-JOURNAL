"use client";

import { useState, useEffect, useCallback } from "react";
import { StatCard } from "@/components/stat-card";
import { Wallet, Briefcase, User as UserIcon } from "lucide-react";
import { supabase } from "@/utils/supabase/client";
import { useAuth } from "@/components/auth-provider";
import { AddAccountForm } from "@/components/capital/add-account-form";
import { AccountList } from "@/components/capital/account-list";

interface Account {
  id: string;
  account_name: string;
  account_type: 'personal' | 'funded';
  balance: number;
}

import { OverviewBalanceCard } from "@/components/capital/overview-balance-card";

export default function CapitalPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<Account[]>([]);

  const fetchAccounts = useCallback(async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('capital_accounts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (data) {
      setAccounts(data as Account[]);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const totalCapital = accounts.reduce((sum, acc) => sum + Number(acc.balance), 0);
  const fundedCapital = accounts
    .filter(acc => acc.account_type === 'funded')
    .reduce((sum, acc) => sum + Number(acc.balance), 0);
  const personalCapital = accounts
    .filter(acc => acc.account_type === 'personal')
    .reduce((sum, acc) => sum + Number(acc.balance), 0);

  const fundedCount = accounts.filter(acc => acc.account_type === 'funded').length;
  const personalCount = accounts.filter(acc => acc.account_type === 'personal').length;

  if (loading) return <div className="p-8 text-gray-400">Loading capital...</div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Capital Manager</h1>
        <p className="text-gray-400">
          You are managing <span className="text-foreground font-semibold">${totalCapital.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span> in total starting capital
          ({fundedCount} Funded | {personalCount} Personal).
        </p>
      </div>

      {/* Main Realtime Net Worth Display */}
      <OverviewBalanceCard />

      <div className="grid gap-6 md:grid-cols-3">
        <StatCard
          title="Total Capital"
          value={`$${totalCapital.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          icon={Wallet}
        />
        <StatCard
          title="Funded Capital"
          value={`$${fundedCapital.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          icon={Briefcase}
        />
        <StatCard
          title="Personal Capital"
          value={`$${personalCapital.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          icon={UserIcon}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <AddAccountForm onAccountAdded={fetchAccounts} />
        </div>
        <div className="lg:col-span-2">
          <AccountList accounts={accounts} onAccountDeleted={fetchAccounts} onAccountUpdated={fetchAccounts} />
        </div>
      </div>
    </div>
  );
}
