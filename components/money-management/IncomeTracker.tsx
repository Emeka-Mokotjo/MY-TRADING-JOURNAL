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

interface IncomeEntry {
  id: string;
  title: string;
  amount: number;
  category: string;
  source_type: string;
  notes?: string;
  received_at: string;
  created_at: string;
}

const SOURCE_TYPES = [
  { value: "payout", label: "Trading Payout" },
  { value: "salary", label: "Salary" },
  { value: "business", label: "Business" },
  { value: "freelance", label: "Freelance" },
  { value: "investment", label: "Investment" },
  { value: "other", label: "Other" },
];

interface IncomeTrackerProps {
  onDataChange: () => void;
}

export function IncomeTracker({ onDataChange }: IncomeTrackerProps) {
  const { user } = useAuth();
  const [entries, setEntries] = useState<IncomeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<IncomeEntry | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    amount: "",
    category: "",
    source_type: "payout",
    notes: "",
    received_at: new Date().toISOString().split('T')[0],
  });

  const fetchEntries = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("income_entries")
        .select("*")
        .eq("user_id", user.id)
        .order("received_at", { ascending: false });

      if (error) throw error;
      setEntries(data || []);
    } catch (error) {
      console.error("Error fetching income entries:", error);
      toast.error("Failed to load income entries");
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
      source_type: "payout",
      notes: "",
      received_at: new Date().toISOString().split('T')[0],
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
        source_type: formData.source_type,
        notes: formData.notes || null,
        received_at: formData.received_at,
      };

      if (editingEntry) {
        const { error } = await supabase
          .from("income_entries")
          .update(entryData)
          .eq("id", editingEntry.id);

        if (error) throw error;
        toast.success("Income entry updated");
      } else {
        const { error } = await supabase
          .from("income_entries")
          .insert(entryData);

        if (error) throw error;
        toast.success("Income entry added");
      }

      resetForm();
      fetchEntries();
      onDataChange();
    } catch (error) {
      console.error("Error saving income entry:", error);
      toast.error("Failed to save income entry");
    }
  };

  const handleEdit = (entry: IncomeEntry) => {
    setEditingEntry(entry);
    setFormData({
      title: entry.title,
      amount: formatZAR(entry.amount),
      category: entry.category,
      source_type: entry.source_type,
      notes: entry.notes || "",
      received_at: entry.received_at,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this income entry?")) return;

    try {
      const { error } = await supabase
        .from("income_entries")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Income entry deleted");
      fetchEntries();
      onDataChange();
    } catch (error) {
      console.error("Error deleting income entry:", error);
      toast.error("Failed to delete income entry");
    }
  };

  const importPayoutAsIncome = async (payoutId: string, amount: number, note?: string) => {
    if (!user) return;

    try {
      const entryData = {
        user_id: user.id,
        title: `Trading Payout Import`,
        amount: amount,
        category: "Trading",
        source_type: "payout",
        notes: note ? `Imported from payout: ${note}` : "Imported from trading payout",
        received_at: new Date().toISOString().split('T')[0],
      };

      const { error } = await supabase
        .from("income_entries")
        .insert(entryData);

      if (error) throw error;
      toast.success("Payout imported as income");
      fetchEntries();
      onDataChange();
    } catch (error) {
      console.error("Error importing payout:", error);
      toast.error("Failed to import payout");
    }
  };

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

  const totalIncome = entries.reduce((sum, entry) => sum + entry.amount, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Income Tracker</CardTitle>
          <Button onClick={() => setShowForm(!showForm)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Income
          </Button>
        </div>
        <div className="text-sm text-gray-400">
          Total Income: {formatZAR(totalIncome)}
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
                  placeholder="e.g., Monthly Salary"
                  required
                />
              </div>
              <div>
                <Label htmlFor="amount">Amount (ZAR)</Label>
                <Input
                  id="amount"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="R12,500.00"
                  required
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g., Salary"
                  required
                />
              </div>
              <div>
                <Label htmlFor="source_type">Source Type</Label>
                <select
                  id="source_type"
                  value={formData.source_type}
                  onChange={(e) => setFormData({ ...formData, source_type: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground"
                  required
                >
                  {SOURCE_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="received_at">Date Received</Label>
                <Input
                  id="received_at"
                  type="date"
                  value={formData.received_at}
                  onChange={(e) => setFormData({ ...formData, received_at: e.target.value })}
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
                {editingEntry ? "Update" : "Add"} Income
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
              No income entries yet. Add your first income entry above.
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
                    {entry.category} • {SOURCE_TYPES.find(t => t.value === entry.source_type)?.label} • {new Date(entry.received_at).toLocaleDateString()}
                  </div>
                  {entry.notes && (
                    <div className="text-xs text-gray-500">{entry.notes}</div>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="font-semibold text-green-400">{formatZAR(entry.amount)}</div>
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