"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/utils/supabase/client";
import { useAuth } from "@/components/auth-provider";

interface Rule {
  id: string;
  rule_name: string;
  rule_value: number;
  description?: string;
  enforcement_type?: string;
  enabled?: boolean;
}

interface AdvancedSupport {
  enabled: boolean;
  description: boolean;
  enforcementType: boolean;
}

interface AddRuleModalProps {
  rule?: Rule | null;
  supportsAdvanced?: AdvancedSupport;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddRuleModal({ rule, supportsAdvanced, onClose, onSuccess }: AddRuleModalProps) {
  const { user } = useAuth();
  const [ruleName, setRuleName] = useState(rule?.rule_name || "");
  const [ruleValue, setRuleValue] = useState(rule?.rule_value ? rule.rule_value.toString() : "");
  const [description, setDescription] = useState(rule?.description || "");
  const [enforcementType, setEnforcementType] = useState(rule?.enforcement_type || "Risk Management");
  const [isActive, setIsActive] = useState(rule?.enabled ?? true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const advanced = supportsAdvanced ?? { enabled: false, description: false, enforcementType: false };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError(null);

    const numericValue = parseFloat(ruleValue);
    if (isNaN(numericValue) || numericValue < 0) {
      setError("Value must be a positive number.");
      setLoading(false);
      return;
    }

    if (ruleName.toLowerCase().includes("risk") && numericValue > 100) {
      setError("Risk percentage cannot exceed 100%.");
      setLoading(false);
      return;
    }

    const payload: Record<string, unknown> = {
      rule_name: ruleName,
      rule_value: numericValue,
    };

    if (advanced.description) payload.description = description;
    if (advanced.enforcementType) payload.enforcement_type = enforcementType;
    if (advanced.enabled) payload.enabled = isActive;

    if (rule) {
      const { error: updateError } = await supabase
        .from("trading_rules")
        .update(payload)
        .eq("id", rule.id);

      if (updateError) {
        setError(updateError.message);
        setLoading(false);
        return;
      }
    } else {
      const insertPayload = { user_id: user.id, ...payload };
      const { error: insertError } = await supabase.from("trading_rules").insert(insertPayload);

      if (insertError) {
        if (insertError.code === "23505") {
          setError("A rule with this name already exists.");
        } else {
          setError(insertError.message);
        }
        setLoading(false);
        return;
      }
    }

    onSuccess();
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-[1.5rem] bg-slate-950/95 border border-white/10 shadow-[0_40px_120px_-50px_rgba(15,23,42,0.95)] p-6">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-slate-400 transition hover:bg-white/5 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-5">
          <h2 className="text-2xl font-semibold text-white">{rule ? "Edit Rule" : "Add New Rule"}</h2>
          <p className="mt-2 text-sm text-slate-400">
            Create a discipline rule with clear thresholds and reinforcement style.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-3xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
            <div className="space-y-2">
              <Label htmlFor="ruleName">Rule Name</Label>
              <Input
                id="ruleName"
                placeholder="e.g. Max Risk per Trade (%)"
                value={ruleName}
                onChange={(e) => setRuleName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ruleValue">Threshold Value</Label>
              <Input
                id="ruleValue"
                type="number"
                step="0.1"
                placeholder="e.g. 2.0"
                value={ruleValue}
                onChange={(e) => setRuleValue(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Rule Description</Label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Trading stops for the day if this limit is reached."
              className="min-h-[104px] w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400/60 focus:ring-2 focus:ring-sky-400/10"
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
            <div className="space-y-2">
              <Label htmlFor="enforcementType">Enforcement Type</Label>
              <select
                id="enforcementType"
                value={enforcementType}
                onChange={(e) => setEnforcementType(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400/60 focus:ring-2 focus:ring-sky-400/10"
              >
                <option>Risk Management</option>
                <option>Loss Prevention</option>
                <option>Trade Frequency</option>
                <option>Profit Target</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Enforcement</Label>
              <button
                type="button"
                onClick={() => setIsActive((prev) => !prev)}
                className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-sm transition ${
                  isActive ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200" : "border-slate-700 bg-slate-900/80 text-slate-300"
                }`}
              >
                <span>{isActive ? "Active" : "Paused"}</span>
                <span className="rounded-full bg-white/10 px-3 py-1 text-[0.7rem] uppercase tracking-[0.24em] text-slate-200">
                  {isActive ? "ON" : "OFF"}
                </span>
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-3 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={onClose} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-500 text-white shadow-[0_20px_70px_-40px_rgba(59,130,246,0.9)] hover:scale-[1.01] transition-transform"
            >
              {loading ? "Saving rule..." : "Save Rule"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
