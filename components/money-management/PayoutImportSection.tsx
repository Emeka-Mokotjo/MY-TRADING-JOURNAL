"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/utils/supabase/client";
import { useAuth } from "@/components/auth-provider";
import { formatZAR, parseZAR } from "@/utils/currency";
import toast from "react-hot-toast";
import { DollarSign, Plus } from "lucide-react";

interface Payout {
  id: string;
  amount: number;
  note: string | null;
  created_at: string;
  account_name?: string;
}

interface AllocationRule {
  id: string;
  category: string;
  percentage: number;
}

interface PayoutImportSectionProps {
  onDataChange: () => void;
}

export function PayoutImportSection({ onDataChange }: PayoutImportSectionProps) {
  const { user } = useAuth();
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [allocationRules, setAllocationRules] = useState<AllocationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [conversionAmounts, setConversionAmounts] = useState<Record<string, string>>({});
  const [allocationEnabled, setAllocationEnabled] = useState<Record<string, boolean>>({});

  const fetchRecentPayouts = async () => {
    if (!user) return;

    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data, error } = await supabase
        .from("payouts")
        .select(`
          id,
          amount,
          note,
          created_at,
          capital_accounts(account_name)
        `)
        .eq("user_id", user.id)
        .gte("created_at", thirtyDaysAgo.toISOString())
        .order("created_at", { ascending: false });

      if (error) throw error;

      const { data: existingIncome } = await supabase
        .from("income_entries")
        .select("notes")
        .eq("user_id", user.id)
        .like("notes", "Imported from payout %");

      const importedPayoutIds = new Set(
        existingIncome?.map((inc) => {
          const match = inc.notes?.match(/Imported from payout\s+([a-f0-9-]+)/i);
          return match ? match[1] : null;
        }).filter(Boolean) || []
      );

      const unimportedPayouts = data
        ?.filter((payout) => !importedPayoutIds.has(payout.id))
        .map((payout) => ({
          ...payout,
          account_name: (payout as any).capital_accounts?.account_name || "Unknown Account",
        })) || [];

      setPayouts(unimportedPayouts);
    } catch (error) {
      console.error("Error fetching payouts:", error);
      toast.error("Unable to load recent payouts");
    } finally {
      setLoading(false);
    }
  };

  const fetchAllocationRules = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("allocation_rules")
      .select("id, category, percentage")
      .eq("user_id", user.id)
      .order("category", { ascending: true });

    if (error) {
      console.error("Error fetching allocation rules:", error);
      return;
    }

    setAllocationRules(data || []);
  };

  useEffect(() => {
    fetchRecentPayouts();
    fetchAllocationRules();
  }, [user]);

  const handleConversionChange = (payoutId: string, value: string) => {
    setConversionAmounts((prev) => ({
      ...prev,
      [payoutId]: value,
    }));
  };

  const toggleAllocationForPayout = (payoutId: string) => {
    setAllocationEnabled((prev) => ({
      ...prev,
      [payoutId]: !prev[payoutId],
    }));
  };

  const importPayout = async (payout: Payout) => {
    if (!user) return;

    const convertedAmount = conversionAmounts[payout.id]
      ? parseZAR(conversionAmounts[payout.id])
      : payout.amount;

    if (conversionAmounts[payout.id] && convertedAmount <= 0) {
      toast.error("Enter a valid ZAR amount before importing.");
      return;
    }

    try {
      const entryData = {
        user_id: user.id,
        title: `Trading Payout - ${payout.account_name}`,
        amount: Number(convertedAmount),
        category: "Trading",
        source_type: "payout",
        notes: `Imported from payout ${payout.id}: ${payout.note || "No note"}`,
        received_at: new Date(payout.created_at).toISOString().split('T')[0],
      };

      const { error } = await supabase
        .from("income_entries")
        .insert(entryData);

      if (error) throw error;
      toast.success("Payout imported as income");
      fetchRecentPayouts();
      onDataChange();
    } catch (error) {
      console.error("Error importing payout:", error);
      toast.error("Failed to import payout");
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (payouts.length === 0) {
    return null; // Don't show if no payouts to import
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Import Trading Payouts
        </CardTitle>
        <p className="text-sm text-gray-400">
          Convert your trading payouts into personal finance income to track your real-world money management.
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {payouts.map((payout) => (
            <div
              key={payout.id}
              className="space-y-3 p-4 bg-card/50 rounded-lg border"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="font-medium text-foreground">
                    {formatZAR(Number(payout.amount))} from {payout.account_name}
                  </div>
                  <div className="text-sm text-gray-400">
                    {new Date(payout.created_at).toLocaleDateString()}
                    {payout.note && ` • ${payout.note}`}
                  </div>
                </div>
                <Button
                  onClick={() => toggleAllocationForPayout(payout.id)}
                  size="sm"
                  variant="outline"
                >
                  {allocationEnabled[payout.id] ? "Disable allocation" : "Enable allocation"}
                </Button>
              </div>

              <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                <div className="space-y-1">
                  <label className="block text-sm text-gray-400">Convert to ZAR</label>
                  <input
                    type="text"
                    value={conversionAmounts[payout.id] ?? formatZAR(Number(payout.amount))}
                    onChange={(event) => handleConversionChange(payout.id, event.target.value)}
                    className="w-full rounded border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter amount in ZAR to preserve local currency reporting.
                  </p>
                </div>
                <Button
                  onClick={() => importPayout(payout)}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add to Income
                </Button>
              </div>

              {allocationEnabled[payout.id] && allocationRules.length > 0 ? (
                <div className="rounded-lg border border-dashed border-border p-3 bg-muted">
                  <div className="text-sm font-semibold text-foreground">Apply allocation rule</div>
                  <div className="mt-2 space-y-2">
                    {allocationRules.map((rule) => (
                      <div key={rule.id} className="flex items-center justify-between gap-4 text-sm">
                        <span>{rule.category}</span>
                        <span className="font-medium">{rule.percentage}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}