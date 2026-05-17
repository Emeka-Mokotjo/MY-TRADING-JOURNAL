"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Wallet, Edit2, X } from "lucide-react";
import { supabase } from "@/utils/supabase/client";
import { useAuth } from "@/components/auth-provider";
import toast from "react-hot-toast";

import Link from "next/link";

interface Account {
  id: string;
  account_name: string;
  account_type: 'personal' | 'funded';
  balance: number;
  platform?: string;
  account_size?: number;
}

interface AccountListProps {
  accounts: Account[];
  onAccountDeleted: () => void;
  onAccountUpdated: () => void;
}

export function AccountList({ accounts, onAccountDeleted, onAccountUpdated }: AccountListProps) {
  const { user } = useAuth();
  
  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editType, setEditType] = useState<'personal' | 'funded'>("personal");
  const [editBalance, setEditBalance] = useState("");
  const [editPlatform, setEditPlatform] = useState("MetaTrader 5");
  const [editAccountSize, setEditAccountSize] = useState("");
  const [loading, setLoading] = useState(false);

  // Delete State
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const startEdit = (acc: Account) => {
    setEditingId(acc.id);
    setEditName(acc.account_name);
    setEditType(acc.account_type);
    setEditBalance(acc.balance.toString());
    setEditPlatform(acc.platform || "MetaTrader 5");
    setEditAccountSize(acc.account_size ? acc.account_size.toString() : "");
  };

  const handleEdit = async () => {
    if (!user || !editingId) return;
    
    if (parseFloat(editBalance) <= 0) {
      toast.error("Balance must be greater than 0");
      return;
    }

    setLoading(true);
    const { error } = await supabase
      .from('capital_accounts')
      .update({
        account_name: editName,
        account_type: editType,
        platform: editPlatform,
        account_size: parseFloat(editAccountSize),
        balance: parseFloat(editBalance),
        updated_at: new Date().toISOString()
      })
      .eq('id', editingId)
      .eq('user_id', user.id);

    if (error) {
      toast.error("Failed to update account");
    } else {
      toast.success("Account updated");
      setEditingId(null);
      onAccountUpdated();
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    
    const { error } = await supabase
      .from('capital_accounts')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      toast.error("Failed to delete account");
    } else {
      toast.success("Account deleted");
      setDeletingId(null);
      onAccountDeleted();
    }
  };

  return (
    <>
      <Card className="flex flex-col h-full">
        <CardHeader>
          <CardTitle>Your Accounts</CardTitle>
          <CardDescription>
            {accounts.length} {accounts.length === 1 ? 'Account' : 'Accounts'} tracked
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto">
          {accounts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Wallet className="h-12 w-12 text-gray-600 mb-4" />
              <p className="text-gray-400">No accounts added yet.</p>
              <p className="text-sm text-gray-500 mt-1">Add your first account to track your capital.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {accounts.map((acc) => (
                <div 
                  key={acc.id} 
                  className="flex items-center justify-between p-4 rounded-lg bg-background/50 border border-border group hover:border-gray-600 transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground">{acc.account_name}</p>
                      <span 
                        className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                          acc.account_type === 'funded' 
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                            : 'bg-green-500/20 text-green-400 border border-green-500/30'
                        }`}
                      >
                        {acc.account_type}
                      </span>
                    </div>
                    <div className="flex items-center gap-6 mt-2">
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Balance</p>
                        <p className="text-sm font-medium text-foreground">
                          ${Number(acc.balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      {acc.account_size && (
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Start Size</p>
                          <p className="text-sm text-gray-400">
                            ${Number(acc.account_size).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      )}
                      {acc.platform && (
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Platform</p>
                          <p className="text-sm text-gray-400">{acc.platform}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Link href={`/accounts/${acc.id}`}>
                      <Button variant="secondary" size="sm" className="h-8 text-xs bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20">
                        View Dashboard
                      </Button>
                    </Link>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                    <button
                      onClick={() => startEdit(acc)}
                      className="p-2 text-gray-500 hover:text-blue-400 hover:bg-blue-400/10 rounded-md transition-colors"
                      aria-label="Edit account"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeletingId(acc.id)}
                      className="p-2 text-gray-500 hover:text-danger hover:bg-danger/10 rounded-md transition-colors"
                      aria-label="Delete account"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Modal */}
      {editingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle>Edit Account</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setEditingId(null)}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Account Name</Label>
                <Input 
                  id="edit-name" 
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-type">Account Type</Label>
                  <select 
                    id="edit-type" 
                    value={editType} 
                    onChange={(e) => setEditType(e.target.value as 'personal' | 'funded')}
                    className="flex h-10 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  >
                    <option value="personal">Personal</option>
                    <option value="funded">Funded</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-platform">Platform</Label>
                  <select 
                    id="edit-platform" 
                    value={editPlatform} 
                    onChange={(e) => setEditPlatform(e.target.value)}
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
                  <Label htmlFor="edit-account-size">Starting Size ($)</Label>
                  <Input 
                    id="edit-account-size" 
                    type="number" 
                    step="0.01" 
                    value={editAccountSize}
                    onChange={(e) => setEditAccountSize(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-balance">Current Balance ($)</Label>
                  <Input 
                    id="edit-balance" 
                    type="number" 
                    step="0.01" 
                    value={editBalance}
                    onChange={(e) => setEditBalance(e.target.value)}
                  />
                </div>
              </div>
              <Button onClick={handleEdit} className="w-full" disabled={loading}>
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete Modal */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <Card className="w-full max-w-sm shadow-2xl">
            <CardHeader>
              <CardTitle>Delete Account</CardTitle>
              <CardDescription>Are you sure? This action cannot be undone.</CardDescription>
            </CardHeader>
            <CardContent className="flex gap-4">
              <Button variant="outline" className="flex-1" onClick={() => setDeletingId(null)}>
                Cancel
              </Button>
              <Button variant="destructive" className="flex-1" onClick={() => handleDelete(deletingId)}>
                Delete
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
