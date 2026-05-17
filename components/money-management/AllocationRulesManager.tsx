"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/utils/supabase/client";
import { useAuth } from "@/components/auth-provider";
import { formatZAR } from "@/utils/currency";
import toast from "react-hot-toast";

interface AllocationRule {
  id: string;
  category: string;
  percentage: number;
}

interface AllocationRulesManagerProps {
  onRulesUpdate: () => void;
}

const DEFAULT_RULES = [
  { category: "Trading Capital", percentage: 40 },
  { category: "Savings", percentage: 25 },
  { category: "Lifestyle", percentage: 20 },
  { category: "Emergency Fund", percentage: 10 },
  { category: "Investments", percentage: 3 },
  { category: "Business", percentage: 2 },
];

export function AllocationRulesManager({ onRulesUpdate }: AllocationRulesManagerProps) {
  const { user } = useAuth();
  const [rules, setRules] = useState<AllocationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [allocationAmount, setAllocationAmount] = useState("R0.00");
  const [showPreview, setShowPreview] = useState(false);

  const fetchRules = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("allocation_rules")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching allocation rules:", error);
      toast.error("Unable to load allocation rules");
      setLoading(false);
      return;
    }

    if (!data || data.length === 0) {
      const defaults = DEFAULT_RULES.map((rule) => ({
        user_id: user.id,
        category: rule.category,
        percentage: rule.percentage,
      }));

      const { data: inserted, error: insertError } = await supabase
        .from("allocation_rules")
        .insert(defaults);

      if (insertError) {
        console.error("Error initializing allocation rules:", insertError);
        toast.error("Unable to initialize allocation rules");
      } else {
        setRules(inserted || []);
      }
      setLoading(false);
      return;
    }

    setRules(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchRules();
  }, [user]);

  const totalPercentage = rules.reduce((sum, rule) => sum + rule.percentage, 0);
  const previewAmount = parseFloat(allocationAmount.replace(/R\s?|,/g, "")) || 0;

  const handleSaveRules = async () => {
    if (totalPercentage !== 100) {
      toast.error("Allocation percentages must total 100%.");
      return;
    }

    try {
      await Promise.all(
        rules.map((rule) =>
          supabase
            .from("allocation_rules")
            .upsert({
              id: rule.id,
              user_id: user?.id,
              category: rule.category,
              percentage: rule.percentage,
            }, { onConflict: "id" })
        )
      );
      toast.success("Allocation rules saved");
      onRulesUpdate();
    } catch (error) {
      console.error("Error saving allocation rules:", error);
      toast.error("Failed to save allocation rules");
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
        <CardTitle>Allocation Rules</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-sm text-gray-400">
          Define how trading payouts flow into disciplined wealth buckets. Use these rules to automatically allocate allocation amounts when a payout is added.
        </p>

        <div className="space-y-4">
          {rules.map((rule, index) => (
            <div key={rule.id} className="space-y-2">
              <div className="flex items-center justify-between gap-4 text-sm font-medium text-foreground">
                <span>{rule.category}</span>
                <span>{rule.percentage}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={rule.percentage}
                onChange={(event) => {
                  const nextPercent = Number(event.target.value);
                  setRules((current) => {
                    const updated = [...current];
                    updated[index] = { ...rule, percentage: nextPercent };
                    return updated;
                  });
                }}
                className="w-full accent-blue-500"
              />
            </div>
          ))}
        </div>

        <div className="rounded-3xl border border-border bg-background/70 p-4">
          <div className="flex items-center justify-between text-sm text-gray-400">
            <span>Total Allocation</span>
            <span className={totalPercentage !== 100 ? "text-amber-400" : "text-green-400"}>{totalPercentage}%</span>
          </div>
          <div className="mt-3 h-3 w-full rounded-full bg-slate-800 overflow-hidden">
            <div
              className={totalPercentage !== 100 ? "bg-amber-400" : "bg-green-400"}
              style={{ width: `${Math.min(totalPercentage, 100)}%` }}
            />
          </div>
          {totalPercentage !== 100 && (
            <p className="mt-3 text-sm text-amber-300">
              Allocation totals must equal 100% to use payout allocation.
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-gray-200">Preview payout allocation</label>
            <input
              value={allocationAmount}
              onChange={(event) => setAllocationAmount(event.target.value)}
              placeholder="R50,000.00"
              className="mt-2 w-full rounded-2xl border border-border bg-background/80 px-4 py-3 text-sm text-foreground outline-none"
            />
          </div>
          <div className="space-y-2 rounded-3xl border border-border bg-card/80 p-4">
            <div className="flex items-center justify-between text-sm text-gray-400">
              <span>Allocated total</span>
              <span>{formatZAR(previewAmount)}</span>
            </div>
            {previewAmount > 0 ? (
              rules.map((rule) => (
                <div key={rule.id} className="flex items-center justify-between text-xs text-gray-300">
                  <span>{rule.category}</span>
                  <span>{formatZAR((rule.percentage / 100) * previewAmount)}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">Enter a payout amount to preview allocations.</p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button onClick={handleSaveRules} disabled={totalPercentage !== 100}>
            Save Allocation Rules
          </Button>
          <Button variant="outline" onClick={() => setShowPreview((prev) => !prev)}>
            {showPreview ? "Hide" : "Show"} Preview
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
