"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase/client";
import { useAuth } from "@/components/auth-provider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pencil, Trash2, CheckCircle2, AlertCircle, X } from "lucide-react";

export default function TradeHistory({ refreshTrigger }: { refreshTrigger: number }) {
  const { user } = useAuth();
  const [trades, setTrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [capitalAccounts, setCapitalAccounts] = useState<Array<{id: string, account_name: string}>>([]);
  const [toast, setToast] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Modal States
  const [editingTrade, setEditingTrade] = useState<any | null>(null);
  const [deletingTrade, setDeletingTrade] = useState<any | null>(null);

  const fetchTrades = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('trades')
      .select(`
        *,
        capital_accounts (
          account_name
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (data) {
      setTrades(data);
    }
    setLoading(false);
  };

  const fetchCapitalAccounts = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('capital_accounts')
      .select('id, account_name')
      .eq('user_id', user.id)
      .order('account_name');
    
    if (data) {
      setCapitalAccounts(data);
    }
  };

  useEffect(() => {
    if (!user) return;

    fetchTrades();
    fetchCapitalAccounts();

    const channel = supabase.channel('realtime-history-trades')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trades', filter: `user_id=eq.${user.id}` }, () => {
        fetchTrades();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, refreshTrigger]);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 3000);
  };

  const handleDelete = async () => {
    if (!deletingTrade) return;
    
    const { error } = await supabase
      .from('trades')
      .delete()
      .eq('id', deletingTrade.id);
      
    if (error) {
      showToast('error', error.message);
    } else {
      setTrades(trades.filter(t => t.id !== deletingTrade.id));
      showToast('success', 'Trade deleted');
    }
    setDeletingTrade(null);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTrade) return;

    const updatedData = {
      pair: editingTrade.pair,
      lot_size: parseFloat(editingTrade.lot_size),
      entry_price: parseFloat(editingTrade.entry_price),
      stop_loss: editingTrade.stop_loss ? parseFloat(editingTrade.stop_loss) : null,
      take_profit: editingTrade.take_profit ? parseFloat(editingTrade.take_profit) : null,
      result: editingTrade.result,
      pnl: parseFloat(editingTrade.pnl),
      notes: editingTrade.notes,
      account_id: editingTrade.account_id,
    };

    const { error } = await supabase
      .from('trades')
      .update(updatedData)
      .eq('id', editingTrade.id);

    if (error) {
      showToast('error', error.message);
    } else {
      setTrades(trades.map(t => t.id === editingTrade.id ? { ...t, ...updatedData } : t));
      showToast('success', 'Trade updated');
      setEditingTrade(null);
    }
  };

  if (!user) return null;

  return (
    <div className="mt-12 space-y-4">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-50">
          <div className={`p-4 rounded-lg shadow-lg flex items-center gap-3 border ${toast.type === 'success' ? 'bg-success/10 border-success/20 text-success' : 'bg-danger/10 border-danger/20 text-danger'} backdrop-blur-md`}>
            {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span className="font-medium">{toast.text}</span>
          </div>
        </div>
      )}

      <div>
        <h2 className="text-2xl font-bold text-foreground mb-1">Trade History</h2>
        <p className="text-gray-400">View, edit, or delete your logged trades.</p>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-400 bg-card border-b border-border uppercase">
              <tr>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Account</th>
                <th className="px-6 py-4 font-medium">Pair</th>
                <th className="px-6 py-4 font-medium">Lot Size</th>
                <th className="px-6 py-4 font-medium">Entry</th>
                <th className="px-6 py-4 font-medium">Result</th>
                <th className="px-6 py-4 font-medium">PnL</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">Loading trades...</td>
                </tr>
              ) : trades.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">No trades logged yet.</td>
                </tr>
              ) : (
                trades.map((trade) => (
                  <tr key={trade.id} className="border-b border-border bg-card hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4 text-gray-300">
                      {new Date(trade.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-gray-300">
                      {trade.capital_accounts?.account_name || 'Unknown Account'}
                    </td>
                    <td className="px-6 py-4 font-medium text-foreground">{trade.pair}</td>
                    <td className="px-6 py-4 text-gray-300">{trade.lot_size}</td>
                    <td className="px-6 py-4 text-gray-300">{trade.entry_price}</td>
                    <td className="px-6 py-4 capitalize">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium
                        ${trade.result === 'win' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' : 
                          trade.result === 'loss' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 
                          'bg-gray-500/10 text-gray-400 border border-gray-500/20'}`}>
                        {trade.result}
                      </span>
                    </td>
                    <td className={`px-6 py-4 font-medium ${trade.pnl > 0 ? 'text-blue-500' : trade.pnl < 0 ? 'text-red-500' : 'text-gray-400'}`}>
                      {trade.pnl > 0 ? '+' : ''}{trade.pnl}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button 
                        onClick={() => setEditingTrade(trade)}
                        className="p-2 text-gray-400 hover:text-blue-400 transition-colors rounded-md hover:bg-blue-400/10 inline-flex items-center justify-center"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setDeletingTrade(trade)}
                        className="p-2 text-gray-400 hover:text-red-400 transition-colors rounded-md hover:bg-red-400/10 inline-flex items-center justify-center"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Delete Confirmation Modal */}
      {deletingTrade && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <Card className="w-full max-w-md border border-border shadow-2xl">
            <CardHeader>
              <CardTitle className="text-xl">Delete Trade</CardTitle>
              <CardDescription>
                Are you sure you want to delete this trade? This action cannot be undone.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setDeletingTrade(null)}>Cancel</Button>
              <Button variant="destructive" onClick={handleDelete} className="bg-red-500 hover:bg-red-600 text-white border-transparent">Delete</Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Modal */}
      {editingTrade && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 overflow-y-auto">
          <Card className="w-full max-w-2xl border border-border shadow-2xl my-8">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl">Edit Trade</CardTitle>
                <CardDescription>Update the details of your logged trade.</CardDescription>
              </div>
              <button onClick={() => setEditingTrade(null)} className="p-2 text-gray-400 hover:text-foreground transition-colors rounded-md">
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdate} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="edit-pair">Pair / Asset</Label>
                    <Input id="edit-pair" required value={editingTrade.pair} onChange={(e) => setEditingTrade({...editingTrade, pair: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-lots">Lot Size</Label>
                    <Input id="edit-lots" required type="number" step="0.01" value={editingTrade.lot_size} onChange={(e) => setEditingTrade({...editingTrade, lot_size: e.target.value})} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-account">Capital Account</Label>
                  <select 
                    id="edit-account" 
                    required 
                    value={editingTrade.account_id || ''} 
                    onChange={(e) => setEditingTrade({...editingTrade, account_id: e.target.value})}
                    className="flex h-10 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  >
                    <option value="">Select Account</option>
                    {capitalAccounts.map((account) => (
                      <option key={account.id} value={account.id}>{account.account_name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="edit-entry">Entry Price</Label>
                    <Input id="edit-entry" required type="number" step="0.00001" value={editingTrade.entry_price} onChange={(e) => setEditingTrade({...editingTrade, entry_price: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-sl">Stop Loss</Label>
                    <Input id="edit-sl" type="number" step="0.00001" value={editingTrade.stop_loss || ''} onChange={(e) => setEditingTrade({...editingTrade, stop_loss: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-tp">Take Profit</Label>
                    <Input id="edit-tp" type="number" step="0.00001" value={editingTrade.take_profit || ''} onChange={(e) => setEditingTrade({...editingTrade, take_profit: e.target.value})} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="edit-result">Result</Label>
                    <select id="edit-result" value={editingTrade.result} onChange={(e) => setEditingTrade({...editingTrade, result: e.target.value})} className="flex h-10 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background">
                      <option value="win">Win</option>
                      <option value="loss">Loss</option>
                      <option value="breakeven">Break Even</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-pnl">Profit / Loss ($)</Label>
                    <Input id="edit-pnl" required type="number" step="0.01" value={editingTrade.pnl} onChange={(e) => setEditingTrade({...editingTrade, pnl: e.target.value})} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-notes">Trade Notes / Emotions</Label>
                  <textarea 
                    id="edit-notes" 
                    rows={4}
                    value={editingTrade.notes || ''} onChange={(e) => setEditingTrade({...editingTrade, notes: e.target.value})}
                    className="flex w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={() => setEditingTrade(null)}>Cancel</Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">Save Changes</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
