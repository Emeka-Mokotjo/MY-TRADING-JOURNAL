"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2, Wallet } from "lucide-react";
import { supabase } from "@/utils/supabase/client";
import { useAuth } from "@/components/auth-provider";
import { calculateTotalCapital, calculateMaxRisk } from "@/utils/capital";
import TradeHistory from "@/components/TradeHistory";
import Link from "next/link";

export default function TrackerPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [totalCapital, setTotalCapital] = useState(0);
  const [hasCapital, setHasCapital] = useState(false);
  const [capitalAccounts, setCapitalAccounts] = useState<Array<{id: string, account_name: string}>>([]);
  const [selectedAccountId, setSelectedAccountId] = useState("");
  
  // Custom Rules State
  const [rules, setRules] = useState<Array<{id: string, rule_name: string, rule_value: number}>>([]);
  const [checkedRules, setCheckedRules] = useState<Record<string, boolean>>({});

  // Form states
  const [pair, setPair] = useState("");
  const [lots, setLots] = useState("");
  const [entry, setEntry] = useState("");
  const [sl, setSl] = useState("");
  const [tp, setTp] = useState("");
  const [result, setResult] = useState("win");
  const [pnl, setPnl] = useState("");
  const [notes, setNotes] = useState("");

  const allRulesChecked = rules.length === 0 || Object.values(checkedRules).every(Boolean);
  const canSubmit = allRulesChecked && hasCapital && selectedAccountId;

  useEffect(() => {
    async function loadTrackerData() {
      if (!user) return;

      // Fetch total capital
      const capital = await calculateTotalCapital(supabase, user.id);
      setTotalCapital(capital);
      setHasCapital(capital > 0);

      // Fetch capital accounts for dropdown
      const { data: accounts } = await supabase
        .from('capital_accounts')
        .select('id, account_name')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (accounts) {
        setCapitalAccounts(accounts);
        if (accounts.length > 0 && !selectedAccountId) {
          setSelectedAccountId(accounts[0].id);
        }
      }

      // Fetch custom trading rules
      const { data: userRules } = await supabase
        .from('trading_rules')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (userRules) {
        setRules(userRules);
        const initialCheckedState: Record<string, boolean> = {};
        userRules.forEach(r => initialCheckedState[r.id] = false);
        setCheckedRules(initialCheckedState);
      }

      setPageLoading(false);
    }

    loadTrackerData();
  }, [user, selectedAccountId]);

  const toggleRule = (id: string) => {
    setCheckedRules(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !canSubmit) return;

    setLoading(true);
    setMessage(null);

    const { error } = await supabase.from('trades').insert({
      user_id: user.id,
      account_id: selectedAccountId,
      pair,
      lot_size: parseFloat(lots),
      entry_price: parseFloat(entry),
      stop_loss: sl ? parseFloat(sl) : null,
      take_profit: tp ? parseFloat(tp) : null,
      result,
      pnl: parseFloat(pnl),
      notes,
      followed_strategy: allRulesChecked,
      risk_managed: allRulesChecked,
    });

    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      setMessage({ type: 'success', text: 'Trade logged successfully!' });
      // Reset form
      setPair(""); setLots(""); setEntry(""); setSl(""); setTp(""); setPnl(""); setNotes("");
      // Reset checkboxes
      const resetState: Record<string, boolean> = {};
      rules.forEach(r => resetState[r.id] = false);
      setCheckedRules(resetState);
      
      setRefreshTrigger(prev => prev + 1);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Trade Tracker</h1>
        <p className="text-gray-400">Log your latest trades and complete your discipline checks.</p>
      </div>

      {!pageLoading && !hasCapital && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-red-600 mb-1">No capital added</p>
            <p className="text-sm text-red-600 mb-3">
              You must add capital before logging trades. Your account balance comes from capital accounts.
            </p>
            <Link href="/dashboard/capital">
              <Button size="sm" variant="outline" className="bg-red-500/10 border-red-500/30 hover:bg-red-500/20">
                <Wallet className="w-4 h-4 mr-2" />
                Add Capital
              </Button>
            </Link>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Discipline System Sidebar */}
        <div className="space-y-6">
          <Card className={`border-2 transition-colors duration-300 ${canSubmit ? 'border-success/50' : 'border-danger/50'}`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                {canSubmit ? <CheckCircle2 className="text-success w-5 h-5" /> : <AlertCircle className="text-danger w-5 h-5" />}
                Discipline System
              </CardTitle>
              <CardDescription>
                You must pass the checklist before logging a trade.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {rules.length === 0 ? (
                <div className="text-sm text-gray-400 p-4 border border-border rounded-lg bg-background">
                  No custom trading rules set. Go to Settings to add your discipline checklist.
                </div>
              ) : (
                rules.map((rule) => {
                  let ruleText = rule.rule_name;
                  if (rule.rule_name.toLowerCase().includes("risk") && rule.rule_value) {
                     const riskAmount = calculateMaxRisk(totalCapital, rule.rule_value);
                     ruleText = `${rule.rule_name} (Max Risk: $${riskAmount.toLocaleString(undefined, {minimumFractionDigits: 2})})`;
                  } else if (rule.rule_value) {
                     ruleText = `${rule.rule_name}: ${rule.rule_value}`;
                  }

                  return (
                    <label key={rule.id} className="flex items-start gap-3 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        className="mt-1 w-5 h-5 rounded border-gray-600 text-primary focus:ring-primary/20 bg-card"
                        checked={checkedRules[rule.id] || false}
                        onChange={() => toggleRule(rule.id)}
                      />
                      <span className="text-sm font-medium group-hover:text-foreground text-gray-300 transition-colors">
                        {ruleText}
                      </span>
                    </label>
                  );
                })
              )}

              {!canSubmit && (
                <div className="p-3 mt-4 rounded-md bg-danger/10 border border-danger/20 text-danger text-sm">
                  {!hasCapital ? (
                    <>Add capital to enable trading</>
                  ) : !selectedAccountId ? (
                    <>Select a capital account to log trades</>
                  ) : rules.length > 0 && !allRulesChecked ? (
                    <>Please complete your discipline checklist.</>
                  ) : null}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Trade Form */}
        <Card className="lg:col-span-2 relative overflow-hidden">
          {!canSubmit && (
            <div className="absolute inset-0 bg-background/50 backdrop-blur-[2px] z-10 flex items-center justify-center">
              <div className="bg-card p-4 rounded-lg shadow-xl border border-border flex items-center gap-3">
                <AlertCircle className="text-primary w-6 h-6" />
                <span className="font-medium">
                  {!hasCapital ? "Add capital to enable trading" : "Complete checklist to unlock"}
                </span>
              </div>
            </div>
          )}
          
          <CardHeader>
            <CardTitle>Log New Trade</CardTitle>
            <CardDescription>Enter the details of your closed position.</CardDescription>
          </CardHeader>
          <CardContent>
            {message && (
              <div className={`p-3 text-sm rounded-md flex items-center gap-2 mb-6 ${message.type === 'success' ? 'bg-success/10 border border-success/20 text-success' : 'bg-danger/10 border border-danger/20 text-danger'}`}>
                {message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                {message.text}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="account">Select Account *</Label>
                <select 
                  id="account" 
                  required 
                  value={selectedAccountId} 
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  <option value="">Choose an account...</option>
                  {capitalAccounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.account_name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500">Select which capital account this trade belongs to.</p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="pair">Pair / Asset</Label>
                  <Input id="pair" required value={pair} onChange={(e)=>setPair(e.target.value)} placeholder="e.g. EURUSD" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lots">Lot Size</Label>
                  <Input id="lots" required type="number" step="0.01" value={lots} onChange={(e)=>setLots(e.target.value)} placeholder="0.5" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="entry">Entry Price</Label>
                  <Input id="entry" required type="number" step="0.00001" value={entry} onChange={(e)=>setEntry(e.target.value)} placeholder="1.08500" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sl">Stop Loss</Label>
                  <Input id="sl" type="number" step="0.00001" value={sl} onChange={(e)=>setSl(e.target.value)} placeholder="1.08200" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tp">Take Profit</Label>
                  <Input id="tp" type="number" step="0.00001" value={tp} onChange={(e)=>setTp(e.target.value)} placeholder="1.09100" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="result">Result</Label>
                  <select id="result" value={result} onChange={(e)=>setResult(e.target.value)} className="flex h-10 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background">
                    <option value="win">Win</option>
                    <option value="loss">Loss</option>
                    <option value="breakeven">Break Even</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pnl">Profit / Loss ($)</Label>
                  <Input id="pnl" required type="number" step="0.01" value={pnl} onChange={(e)=>setPnl(e.target.value)} placeholder="+150.00" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Trade Notes / Emotions</Label>
                <textarea 
                  id="notes" 
                  rows={4}
                  value={notes} onChange={(e)=>setNotes(e.target.value)}
                  className="flex w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  placeholder="Felt slightly anxious but held to TP..."
                />
              </div>

              <div className="flex justify-end">
                <Button type="submit" size="lg" disabled={!canSubmit || loading}>
                  {loading ? "Logging..." : "Log Trade"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Trade History Log */}
      <TradeHistory refreshTrigger={refreshTrigger} />
    </div>
  );
}
