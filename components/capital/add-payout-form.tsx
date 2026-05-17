"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/utils/supabase/client";
import { useAuth } from "@/components/auth-provider";
import { validatePayoutAmount } from "@/utils/payouts";
import { syncPayoutTransaction } from "@/utils/finance";
import toast from "react-hot-toast";
import { Wallet } from "lucide-react";

interface AddPayoutFormProps {
  onPayoutAdded: () => void;
}

interface Account {
  id: string;
  account_name: string;
  balance: number;
  account_type: "personal" | "funded";
}

export function AddPayoutForm({ onPayoutAdded }: AddPayoutFormProps) {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountId, setAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingAccounts, setLoadingAccounts] = useState(true);

  // Fetch available accounts
  useEffect(() => {
    async function loadAccounts() {
      if (!user) return;

      const { data } = await supabase
        .from("capital_accounts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (data) {
        setAccounts(data as Account[]);
        if (data.length > 0) {
          setAccountId(data[0].id);
        }
      }
      setLoadingAccounts(false);
    }

    loadAccounts();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !accountId) {
      toast.error("Please select an account");
      return;
    }

    const parsedAmount = parseFloat(amount);

    // Validate amount
    const validation = await validatePayoutAmount(
      supabase,
      accountId,
      user.id,
      parsedAmount
    );

    if (!validation.isValid) {
      toast.error(validation.message);
      return;
    }

    setLoading(true);

    const { data, error } = await supabase
      .from("payouts")
      .insert({
        user_id: user.id,
        account_id: accountId,
        amount: parsedAmount,
        note: note || null,
      })
      .select("id, created_at")
      .single();

    if (error) {
      toast.error(error.message);
    } else {
      if (data?.id) {
        await syncPayoutTransaction(supabase, {
          id: data.id,
          user_id: user.id,
          account_id: accountId,
          amount: parsedAmount,
          note: note || null,
          created_at: data.created_at,
        });
      }
      toast.success("Withdrawal recorded successfully");
      setAmount("");
      setNote("");
      if (accounts.length > 0) {
        setAccountId(accounts[0].id);
      }
      onPayoutAdded();
    }
    setLoading(false);
  };

  if (loadingAccounts) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Add Withdrawal</CardTitle>
          <CardDescription>Record a withdrawal from your account.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-gray-700 rounded"></div>
            <div className="h-10 bg-gray-700 rounded"></div>
            <div className="h-10 bg-gray-700 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (accounts.length === 0) {
    return (
      <Card className="border-yellow-900/50 bg-yellow-950/30">
        <CardHeader>
          <CardTitle>Add Withdrawal</CardTitle>
          <CardDescription>Record a withdrawal from your account.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Wallet className="h-12 w-12 text-gray-600 mb-3" />
            <p className="text-gray-300 font-medium">No accounts available</p>
            <p className="text-sm text-gray-400 mt-1">
              Add an account in the Capital section first.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const selectedAccount = accounts.find((acc) => acc.id === accountId);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Withdrawal</CardTitle>
        <CardDescription>Record a withdrawal from your account.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Account Selection */}
          <div className="space-y-2">
            <Label htmlFor="account">Select Account</Label>
            <select
              id="account"
              required
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="flex h-10 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.account_name} (${acc.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })})
                </option>
              ))}
            </select>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="amount">
              Withdrawal Amount ($)
            </Label>
            <Input
              id="amount"
              required
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="500.00"
            />
            {selectedAccount && (
              <p className="text-xs text-gray-400">
                Available balance: ${selectedAccount.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            )}
          </div>

          {/* Note Input */}
          <div className="space-y-2">
            <Label htmlFor="note">Note (Optional)</Label>
            <Input
              id="note"
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Personal withdrawal, living expenses"
            />
          </div>

          {/* Submit Button */}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Recording..." : "Add Withdrawal"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
