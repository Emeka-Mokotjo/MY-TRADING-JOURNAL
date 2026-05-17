"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/utils/supabase/client";
import { useAuth } from "@/components/auth-provider";
import { formatZAR, parseZAR } from "@/utils/currency";
import toast from "react-hot-toast";

const CYCLES = [
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "yearly", label: "Yearly" },
];

interface RecurringExpense {
  id: string;
  title: string;
  amount: number;
  category: string;
  billing_cycle: string;
  created_at: string;
}

interface RecurringExpensesProps {
  onDataChange: () => void;
}

const cycleMultiplier: Record<string, number> = {
  monthly: 1,
  quarterly: 1 / 3,
  yearly: 1 / 12,
};

export function RecurringExpenses({ onDataChange }: RecurringExpensesProps) {
  const { user } = useAuth();
  const [entries, setEntries] = useState<RecurringExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<RecurringExpense | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ title: "", amount: "", category: "", billing_cycle: "monthly" });

  const fetchEntries = async () => {
    if (!user) return;
    setLoading(true);

    const { data, error } = await supabase
      .from("recurring_expenses")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching recurring expenses:", error);
      toast.error("Unable to load recurring expenses");
      setLoading(false);
      return;
    }

    setEntries(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchEntries();
  }, [user]);

  const totalMonthlyBurn = entries.reduce((sum, entry) => {
    const multiplier = cycleMultiplier[entry.billing_cycle] || 1;
    return sum + entry.amount * multiplier;
  }, 0);

  const categoryBreakdown = entries.reduce<Record<string, number>>((result, entry) => {
    const multiplier = cycleMultiplier[entry.billing_cycle] || 1;
    result[entry.category] = (result[entry.category] || 0) + entry.amount * multiplier;
    return result;
  }, {});

  const resetForm = () => {
    setFormData({ title: "", amount: "", category: "", billing_cycle: "monthly" });
    setEditing(null);
    setShowForm(false);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) return;

    const amount = parseZAR(formData.amount);
    if (amount <= 0) {
      toast.error("Amount must be greater than 0");
      return;
    }

    const record = {
      user_id: user.id,
      title: formData.title,
      amount,
      category: formData.category,
      billing_cycle: formData.billing_cycle,
    };

    try {
      if (editing) {
        const { error } = await supabase
          .from("recurring_expenses")
          .update(record)
          .eq("id", editing.id);
        if (error) throw error;
        toast.success("Recurring expense updated");
      } else {
        const { error } = await supabase
          .from("recurring_expenses")
          .insert(record);
        if (error) throw error;
        toast.success("Recurring expense added");
      }
      resetForm();
      fetchEntries();
      onDataChange();
    } catch (error) {
      console.error("Error saving recurring expense:", error);
      toast.error("Failed to save recurring expense");
    }
  };

  const handleEdit = (entry: RecurringExpense) => {
    setEditing(entry);
    setFormData({
      title: entry.title,
      amount: formatZAR(entry.amount),
      category: entry.category,
      billing_cycle: entry.billing_cycle,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this recurring expense?")) return;

    try {
      const { error } = await supabase
        .from("recurring_expenses")
        .delete()
        .eq("id", id);
      if (error) throw error;
      toast.success("Recurring expense deleted");
      fetchEntries();
      onDataChange();
    } catch (error) {
      console.error("Error deleting recurring expense:", error);
      toast.error("Failed to delete recurring expense");
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
        <CardTitle>Recurring Expenses</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-sm text-gray-400">
          Track fixed monthly obligations and spot recurring burn before it becomes a liability.
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-4">
            {entries.length === 0 ? (
              <div className="rounded-3xl border border-border bg-background/70 p-6 text-center text-gray-400">
                No recurring expenses yet.
              </div>
            ) : (
              entries.map((entry) => (
                <div key={entry.id} className="rounded-3xl border border-border bg-card/80 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-foreground">{entry.title}</p>
                      <p className="text-xs text-gray-400">{entry.category} • {entry.billing_cycle}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-foreground">{formatZAR(entry.amount)}</p>
                      <div className="mt-2 flex gap-2 text-xs">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(entry)}>Edit</Button>
                        <Button variant="ghost" size="sm" className="text-red-400" onClick={() => handleDelete(entry.id)}>Delete</Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="rounded-3xl border border-border bg-background/80 p-4">
            <h3 className="text-sm font-semibold text-foreground mb-4">Monthly Burn</h3>
            <p className="text-3xl font-bold text-foreground">{formatZAR(totalMonthlyBurn)}</p>
            <p className="mt-2 text-sm text-gray-400">Current fixed cost coverage from recurring categories.</p>
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Rent"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (ZAR)</Label>
                <Input
                  id="amount"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="R2,500.00"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g., Utilities"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="billing_cycle">Billing Cycle</Label>
                <select
                  id="billing_cycle"
                  value={formData.billing_cycle}
                  onChange={(e) => setFormData({ ...formData, billing_cycle: e.target.value })}
                  className="w-full rounded-2xl border border-border bg-background/80 px-4 py-3 text-sm text-foreground outline-none"
                >
                  {CYCLES.map((cycle) => (
                    <option key={cycle.value} value={cycle.value}>{cycle.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <Button type="submit">{editing ? "Update" : "Add"} Recurring Expense</Button>
                <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
              </div>
            </form>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Object.entries(categoryBreakdown).map(([category, amount], index) => (
            <div key={`${category}-${index}`} className="rounded-3xl border border-border bg-card/80 p-4">
              <p className="text-sm text-gray-400">{category}</p>
              <p className="mt-2 text-xl font-semibold text-foreground">{formatZAR(amount)}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
