"use client";

import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/utils/supabase/client";
import { useAuth } from "@/components/auth-provider";
import { formatZAR, parseZAR } from "@/utils/currency";
import toast from "react-hot-toast";

interface ExpenseEntry {
  id: string;
  title: string;
  amount: number;
  category: string;
  necessity_level: string;
  notes?: string;
  spent_at: string;
  created_at: string;
}

const NECESSITY_LEVELS = [
  { value: "essential", label: "Essential" },
  { value: "non_essential", label: "Non-Essential" },
];

interface ExpenseTrackerProps {
  onDataChange: () => void;
}

export function ExpenseTracker({ onDataChange }: ExpenseTrackerProps) {
  const { user } = useAuth();
  const [entries, setEntries] = useState<ExpenseEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<ExpenseEntry | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    amount: "",
    category: "",
    necessity_level: "essential",
    notes: "",
    spent_at: new Date().toISOString().split('T')[0],
  });

  const fetchEntries = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("expense_entries")
        .select("*")
        .eq("user_id", user.id)
        .order("spent_at", { ascending: false });

      if (error) throw error;
      setEntries(data || []);
    } catch (error) {
      console.error("Error fetching expense entries:", error);
      toast.error("Failed to load expense entries");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, [user]);

  const resetForm = () => {
    setFormData({
      title: "",
      amount: "",
      category: "",
      necessity_level: "essential",
      notes: "",
      spent_at: new Date().toISOString().split('T')[0],
    });
    setEditingEntry(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const amount = parseZAR(formData.amount);
      if (amount <= 0) {
        toast.error("Amount must be greater than 0");
        return;
      }

      const entryData = {
        user_id: user.id,
        title: formData.title,
        amount,
        category: formData.category,
        necessity_level: formData.necessity_level,
        notes: formData.notes || null,
        spent_at: formData.spent_at,
      };

      if (editingEntry) {
        const { error } = await supabase
          .from("expense_entries")
          .update(entryData)
          .eq("id", editingEntry.id);

        if (error) throw error;
        toast.success("Expense entry updated");
      } else {
        const { error } = await supabase
          .from("expense_entries")
          .insert(entryData);

        if (error) throw error;
        toast.success("Expense entry added");
      }

      resetForm();
      fetchEntries();
      onDataChange();
    } catch (error) {
      console.error("Error saving expense entry:", error);
      toast.error("Failed to save expense entry");
    }
  };

  const handleEdit = (entry: ExpenseEntry) => {
    setEditingEntry(entry);
    setFormData({
      title: entry.title,
      amount: formatZAR(entry.amount),
      category: entry.category,
      necessity_level: entry.necessity_level,
      notes: entry.notes || "",
      spent_at: entry.spent_at,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this expense entry?")) return;

    try {
      const { error } = await supabase
        .from("expense_entries")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Expense entry deleted");
      fetchEntries();
      onDataChange();
    } catch (error) {
      console.error("Error deleting expense entry:", error);
      toast.error("Failed to delete expense entry");
    }
  };

  const totalExpenses = entries.reduce((sum, entry) => sum + entry.amount, 0);
  const essentialExpenses = entries
    .filter(entry => entry.necessity_level === "essential")
    .reduce((sum, entry) => sum + entry.amount, 0);
  const nonEssentialExpenses = totalExpenses - essentialExpenses;

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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Expense Tracker</CardTitle>
          <Button onClick={() => setShowForm(!showForm)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Expense
          </Button>
        </div>
        <div className="text-sm text-gray-400 space-y-1">
          <div>Total Expenses: {formatZAR(totalExpenses)}</div>
          <div>Essential: {formatZAR(essentialExpenses)} • Non-Essential: {formatZAR(nonEssentialExpenses)}</div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {showForm && (
          <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-card/50 rounded-lg border">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Groceries"
                  required
                />
              </div>
              <div>
                <Label htmlFor="amount">Amount (ZAR)</Label>
                <Input
                  id="amount"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="R1,250.00"
                  required
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g., Food"
                  required
                />
              </div>
              <div>
                <Label htmlFor="necessity_level">Necessity Level</Label>
                <select
                  id="necessity_level"
                  value={formData.necessity_level}
                  onChange={(e) => setFormData({ ...formData, necessity_level: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground"
                  required
                >
                  {NECESSITY_LEVELS.map((level) => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="spent_at">Date Spent</Label>
                <Input
                  id="spent_at"
                  type="date"
                  value={formData.spent_at}
                  onChange={(e) => setFormData({ ...formData, spent_at: e.target.value })}
                  required
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Input
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes..."
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit">
                {editingEntry ? "Update" : "Add"} Expense
              </Button>
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancel
              </Button>
            </div>
          </form>
        )}

        <div className="space-y-2">
          {entries.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              No expense entries yet. Add your first expense entry above.
            </div>
          ) : (
            entries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between p-4 bg-card/50 rounded-lg border"
              >
                <div className="space-y-1">
                  <div className="font-medium text-foreground">{entry.title}</div>
                  <div className="text-sm text-gray-400">
                    {entry.category} • {NECESSITY_LEVELS.find(l => l.value === entry.necessity_level)?.label} • {new Date(entry.spent_at).toLocaleDateString()}
                  </div>
                  {entry.notes && (
                    <div className="text-xs text-gray-500">{entry.notes}</div>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className={`font-semibold ${
                      entry.necessity_level === "essential" ? "text-red-400" : "text-orange-400"
                    }`}>
                      -{formatZAR(entry.amount)}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(entry)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(entry.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}