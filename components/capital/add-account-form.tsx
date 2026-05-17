"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/utils/supabase/client";
import { useAuth } from "@/components/auth-provider";
import toast from "react-hot-toast";

interface AddAccountFormProps {
  onAccountAdded: () => void;
}

export function AddAccountForm({ onAccountAdded }: AddAccountFormProps) {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [type, setType] = useState<'personal' | 'funded'>("personal");
  const [platform, setPlatform] = useState("MetaTrader 5");
  const [accountSize, setAccountSize] = useState("");
  const [balance, setBalance] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (parseFloat(balance) <= 0 || parseFloat(accountSize) <= 0) {
      toast.error("Balance and Starting Size must be greater than 0");
      return;
    }

    setLoading(true);

    const { error: insertError } = await supabase.from('capital_accounts').insert({
      user_id: user.id,
      account_name: name,
      account_type: type,
      platform: platform,
      account_size: parseFloat(accountSize),
      balance: parseFloat(balance),
    });

    if (insertError) {
      toast.error(insertError.message);
    } else {
      toast.success("Account added");
      setName("");
      setBalance("");
      setAccountSize("");
      setPlatform("MetaTrader 5");
      setType("personal");
      onAccountAdded();
    }
    setLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Account</CardTitle>
        <CardDescription>Track a new personal or funded account.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Account Name</Label>
            <Input 
              id="name" 
              required 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. FTMO Challenge 100k" 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <select 
                id="type" 
                required
                value={type} 
                onChange={(e) => setType(e.target.value as 'personal' | 'funded')}
                className="flex h-10 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <option value="personal">Personal</option>
                <option value="funded">Funded</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="platform">Platform</Label>
              <select 
                id="platform" 
                required
                value={platform} 
                onChange={(e) => setPlatform(e.target.value)}
                className="flex h-10 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <option value="MetaTrader 4">MetaTrader 4</option>
                <option value="MetaTrader 5">MetaTrader 5</option>
                <option value="cTrader">cTrader</option>
                <option value="TradeLocker">TradeLocker</option>
                <option value="DXTrade">DXTrade</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="account_size">Starting Size ($)</Label>
              <Input 
                id="account_size" 
                required 
                type="number" 
                step="0.01" 
                value={accountSize}
                onChange={(e) => setAccountSize(e.target.value)}
                placeholder="100000" 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="balance">Current Balance ($)</Label>
              <Input 
                id="balance" 
                required 
                type="number" 
                step="0.01" 
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                placeholder="100000" 
              />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Adding..." : "Add Account"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
