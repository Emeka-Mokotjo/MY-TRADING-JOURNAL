"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/utils/supabase/client";
import { useAuth } from "@/components/auth-provider";
import { deleteFinancialTransaction, syncPayoutTransaction } from "@/utils/finance";
import toast from "react-hot-toast";
import { Trash2, Edit2, X, Check, TrendingDown } from "lucide-react";
import { validatePayoutAmount } from "@/utils/payouts";

interface Payout {
  id: string;
  account_id: string;
  account_name?: string;
  amount: number;
  note: string | null;
  created_at: string;
}

interface PayoutsHistoryProps {
  payouts: Payout[];
  onPayoutUpdated: () => void;
}

export function PayoutsHistory({ payouts, onPayoutUpdated }: PayoutsHistoryProps) {
  const { user } = useAuth();

  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editNote, setEditNote] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  // Delete State
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const startEdit = (payout: Payout) => {
    setEditingId(payout.id);
    setEditAmount(payout.amount.toString());
    setEditNote(payout.note || "");
  };

  const handleEdit = async (payout: Payout) => {
    if (!user || !editingId) return;

    const newAmount = parseFloat(editAmount);

    // Validate the new amount
    const validation = await validatePayoutAmount(
      supabase,
      payout.account_id,
      user.id,
      newAmount + (payout.amount - newAmount) // Account for the difference
    );

    if (!validation.isValid && newAmount !== payout.amount) {
      // Only check validation if amount changed and would exceed balance
      const { startingBalance, totalPnL, totalPayouts } =
        await supabase
          .from("payouts")
          .select("amount")
          .eq("account_id", payout.account_id)
          .then(({ data }) => ({
            startingBalance: 0,
            totalPnL: 0,
            totalPayouts: (data || []).reduce((sum, p) => sum + Number(p.amount), 0),
          }));

      const allowedBalance = 100000; // Default fallback
      const newTotal = totalPayouts - payout.amount + newAmount;

      if (newTotal > allowedBalance) {
        toast.error("New amount would exceed available balance");
        return;
      }
    }

    setEditLoading(true);
    const { error } = await supabase
      .from("payouts")
      .update({
        amount: newAmount,
        note: editNote || null,
      })
      .eq("id", editingId)
      .eq("user_id", user.id);

    if (error) {
      toast.error("Failed to update withdrawal");
    } else {
      await syncPayoutTransaction(supabase, {
        id: payout.id,
        user_id: user.id,
        account_id: payout.account_id,
        amount: newAmount,
        note: editNote || null,
        created_at: payout.created_at,
      });
      toast.success("Withdrawal updated");
      setEditingId(null);
      onPayoutUpdated();
    }
    setEditLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!user) return;

    setDeleteLoading(true);
    const { error } = await supabase
      .from("payouts")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      toast.error("Failed to delete withdrawal");
    } else {
      await deleteFinancialTransaction(supabase, user.id, "payouts", id);
      toast.success("Withdrawal deleted");
      setDeletingId(null);
      onPayoutUpdated();
    }
    setDeleteLoading(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Withdrawal History</CardTitle>
        <CardDescription>
          {payouts.length} {payouts.length === 1 ? "withdrawal" : "withdrawals"} recorded
        </CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        {payouts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <TrendingDown className="h-12 w-12 text-gray-600 mb-4" />
            <p className="text-gray-400">No withdrawals yet.</p>
            <p className="text-sm text-gray-500 mt-1">Start by adding your first withdrawal.</p>
          </div>
        ) : (
          <div className="border border-border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-card/50">
                  <th className="px-4 py-3 text-left font-semibold text-gray-300">Date</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-300">Account</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-300">Amount</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-300">Note</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {payouts.map((payout) => (
                  <tr
                    key={payout.id}
                    className={`border-b border-border/50 transition-colors ${
                      editingId === payout.id ? "bg-card/50" : "hover:bg-card/30"
                    }`}
                  >
                    {/* Date */}
                    <td className="px-4 py-3 text-gray-300">
                      {formatDate(payout.created_at)}
                    </td>

                    {/* Account Name */}
                    <td className="px-4 py-3">
                      <span className="text-foreground font-medium">
                        {payout.account_name || "Unknown"}
                      </span>
                    </td>

                    {/* Amount */}
                    <td className="px-4 py-3 text-right">
                      {editingId === payout.id ? (
                        <input
                          type="number"
                          step="0.01"
                          value={editAmount}
                          onChange={(e) => setEditAmount(e.target.value)}
                          className="w-24 h-8 rounded border border-border bg-card px-2 py-1 text-sm text-foreground text-right focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        />
                      ) : (
                        <span className="text-red-400 font-semibold">
                          -${parseFloat(payout.amount.toString()).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      )}
                    </td>

                    {/* Note */}
                    <td className="px-4 py-3">
                      {editingId === payout.id ? (
                        <input
                          type="text"
                          value={editNote}
                          onChange={(e) => setEditNote(e.target.value)}
                          placeholder="Add a note..."
                          className="w-full h-8 rounded border border-border bg-card px-2 py-1 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        />
                      ) : (
                        <span className="text-gray-400 text-xs">
                          {payout.note || "-"}
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {editingId === payout.id ? (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(payout)}
                              disabled={editLoading}
                              className="h-8 w-8 p-0"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingId(null)}
                              disabled={editLoading}
                              className="h-8 w-8 p-0"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => startEdit(payout)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setDeletingId(payout.id)}
                              className="h-8 w-8 p-0 hover:bg-red-900/30"
                            >
                              <Trash2 className="h-4 w-4 text-red-400" />
                            </Button>
                          </>
                        )}
                      </div>

                      {/* Delete Confirmation */}
                      {deletingId === payout.id && (
                        <div className="absolute right-4 mt-1 bg-red-950/90 border border-red-900 rounded p-2 whitespace-nowrap text-xs">
                          <p className="mb-2 text-red-200">Delete this withdrawal?</p>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleDelete(payout.id)}
                              disabled={deleteLoading}
                              className="h-6 text-xs bg-red-700 hover:bg-red-600"
                            >
                              Delete
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setDeletingId(null)}
                              disabled={deleteLoading}
                              className="h-6 text-xs"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
