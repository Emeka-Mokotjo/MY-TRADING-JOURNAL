"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { supabase } from "@/utils/supabase/client";
import { useAuth } from "@/components/auth-provider";
import toast from "react-hot-toast";

interface Trade {
  id: string;
  pair: string;
  lot_size: number;
  entry_price: number;
  stop_loss: number | null;
  take_profit: number | null;
  result: string;
  pnl: number;
  notes: string | null;
  followed_strategy: boolean;
  risk_managed: boolean;
}

interface EditTradeModalProps {
  trade: Trade;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditTradeModal({ trade, onClose, onSuccess }: EditTradeModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  
  const [pair, setPair] = useState(trade.pair);
  const [lots, setLots] = useState(trade.lot_size.toString());
  const [entry, setEntry] = useState(trade.entry_price.toString());
  const [sl, setSl] = useState(trade.stop_loss?.toString() || "");
  const [tp, setTp] = useState(trade.take_profit?.toString() || "");
  const [result, setResult] = useState(trade.result);
  const [pnl, setPnl] = useState(trade.pnl.toString());
  const [notes, setNotes] = useState(trade.notes || "");
  const [strategyChecked, setStrategyChecked] = useState(trade.followed_strategy);
  const [riskChecked, setRiskChecked] = useState(trade.risk_managed);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    const { error } = await supabase
      .from('trades')
      .update({
        pair,
        lot_size: parseFloat(lots),
        entry_price: parseFloat(entry),
        stop_loss: sl ? parseFloat(sl) : null,
        take_profit: tp ? parseFloat(tp) : null,
        result,
        pnl: parseFloat(pnl),
        notes,
        followed_strategy: strategyChecked,
        risk_managed: riskChecked,
      })
      .eq('id', trade.id)
      .eq('user_id', user.id);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Trade updated");
      onSuccess();
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto py-10">
      <Card className="w-full max-w-2xl shadow-2xl relative my-auto">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle>Edit Trade</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-pair">Pair</Label>
                <Input id="edit-pair" required value={pair} onChange={(e)=>setPair(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-lots">Lot Size</Label>
                <Input id="edit-lots" required type="number" step="0.01" value={lots} onChange={(e)=>setLots(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-entry">Entry</Label>
                <Input id="edit-entry" required type="number" step="0.00001" value={entry} onChange={(e)=>setEntry(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-sl">Stop Loss</Label>
                <Input id="edit-sl" type="number" step="0.00001" value={sl} onChange={(e)=>setSl(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-tp">Take Profit</Label>
                <Input id="edit-tp" type="number" step="0.00001" value={tp} onChange={(e)=>setTp(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-result">Result</Label>
                <select id="edit-result" value={result} onChange={(e)=>setResult(e.target.value)} className="flex h-10 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background">
                  <option value="win">Win</option>
                  <option value="loss">Loss</option>
                  <option value="breakeven">Break Even</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-pnl">PnL ($)</Label>
                <Input id="edit-pnl" required type="number" step="0.01" value={pnl} onChange={(e)=>setPnl(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-notes">Notes</Label>
              <Input id="edit-notes" value={notes} onChange={(e)=>setNotes(e.target.value)} />
            </div>

            <div className="space-y-2 bg-background p-3 rounded-md border border-border">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={strategyChecked} onChange={(e)=>setStrategyChecked(e.target.checked)} className="rounded border-gray-600 bg-card" />
                <span className="text-sm">Followed Strategy</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={riskChecked} onChange={(e)=>setRiskChecked(e.target.checked)} className="rounded border-gray-600 bg-card" />
                <span className="text-sm">Risk Managed</span>
              </label>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
