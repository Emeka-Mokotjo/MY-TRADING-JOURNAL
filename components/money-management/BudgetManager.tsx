"use client";

import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/utils/supabase/client";
import { useAuth } from "@/components/auth-provider";
import { formatZAR, parseZAR } from "@/utils/currency";
import toast from "react-hot-toast";
import { cn } from "@/utils/cn";

interface Budget {
  id: string;
  category: string;
  monthly_limit: number;
  created_at: string;
}

interface BudgetManagerProps {
  onDataChange: () => void;
}

export function BudgetManager({ onDataChange }: BudgetManagerProps) {
  const { user } = useAuth();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [formData, setFormData] = useState({
    category: "",
    monthly_limit: "",
  });
  const [monthlyExpenses, setMonthlyExpenses] = useState<Record<string, number>>({});

  const fetchBudgets = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("budgets")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setBudgets(data || []);
    } catch (error) {
      console.error("Error fetching budgets:", error);
      toast.error("Failed to load budgets");
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthlyExpenses = async () => {
    if (!user) return;

    try {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const { data, error } = await supabase
        .from("expense_entries")
        .select("category, amount")
        .eq("user_id", user.id)
        .gte("spent_at", monthStart.toISOString().split('T')[0])
        .lte("spent_at", monthEnd.toISOString().split('T')[0]);

      if (error) throw error;

      const expensesByCategory: Record<string, number> = {};
      data?.forEach((expense) => {
        expensesByCategory[expense.category] = (expensesByCategory[expense.category] || 0) + expense.amount;
      });

      setMonthlyExpenses(expensesByCategory);
    } catch (error) {
      console.error("Error fetching monthly expenses:", error);
    }
  };

  useEffect(() => {
    fetchBudgets();
    fetchMonthlyExpenses();
  }, [user]);

  const resetForm = () => {
    setFormData({
      category: "",
      monthly_limit: "",
    });
    setEditingBudget(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const monthlyLimit = parseZAR(formData.monthly_limit);
      if (monthlyLimit <= 0) {
        toast.error("Monthly limit must be greater than 0");
        return;
      }

      const budgetData = {
        user_id: user.id,
        category: formData.category,
        monthly_limit: monthlyLimit,
      };

      if (editingBudget) {
        const { error } = await supabase
          .from("budgets")
          .update(budgetData)
          .eq("id", editingBudget.id);

        if (error) throw error;
        toast.success("Budget updated");
      } else {
        const { error } = await supabase
          .from("budgets")
          .insert(budgetData);

        if (error) {
          if (error.code === '23505') { // Unique constraint violation
            toast.error("A budget for this category already exists");
            return;
          }
          throw error;
        }
        toast.success("Budget added");
      }

      resetForm();
      fetchBudgets();
      onDataChange();
    } catch (error) {
      console.error("Error saving budget:", error);
      toast.error("Failed to save budget");
    }
  };

  const handleEdit = (budget: Budget) => {
    setEditingBudget(budget);
    setFormData({
      category: budget.category,
      monthly_limit: formatZAR(budget.monthly_limit),
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this budget?")) return;

    try {
      const { error } = await supabase
        .from("budgets")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Budget deleted");
      fetchBudgets();
      onDataChange();
    } catch (error) {
      console.error("Error deleting budget:", error);
      toast.error("Failed to delete budget");
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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Monthly Budgets</CardTitle>
          <Button onClick={() => setShowForm(!showForm)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Budget
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {showForm && (
          <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-card/50 rounded-lg border">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <Label htmlFor="monthly_limit">Monthly Limit (ZAR)</Label>
                <Input
                  id="monthly_limit"
                  value={formData.monthly_limit}
                  onChange={(e) => setFormData({ ...formData, monthly_limit: e.target.value })}
                  placeholder="R5,000.00"
                  required
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit">
                {editingBudget ? "Update" : "Add"} Budget
              </Button>
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancel
              </Button>
            </div>
          </form>
        )}

        <div className="space-y-4">
          {budgets.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              No budgets set yet. Add your first budget above.
            </div>
          ) : (
            budgets.map((budget) => {
              const spent = monthlyExpenses[budget.category] || 0;
              const remaining = budget.monthly_limit - spent;
              const percentage = (spent / budget.monthly_limit) * 100;
              const isOverBudget = spent > budget.monthly_limit;

              return (
                <div
                  key={budget.id}
                  className={cn(
                    "p-4 bg-card/50 rounded-lg border",
                    isOverBudget && "border-red-500/50 bg-red-500/5"
                  )}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-foreground">{budget.category}</h3>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(budget)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(budget.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Spent / Limit</span>
                      <span className={cn(
                        "font-medium",
                        isOverBudget ? "text-red-400" : "text-foreground"
                      )}>
                        {formatZAR(spent)} / {formatZAR(budget.monthly_limit)}
                      </span>
                    </div>

                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className={cn(
                          "h-2 rounded-full transition-all duration-300",
                          isOverBudget ? "bg-red-500" : percentage > 80 ? "bg-yellow-500" : "bg-green-500"
                        )}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>

                    <div className="flex justify-between items-center text-sm">
                      <span className={cn(
                        "font-medium",
                        remaining >= 0 ? "text-green-400" : "text-red-400"
                      )}>
                        {remaining >= 0 ? `${formatZAR(remaining)} remaining` : `${formatZAR(Math.abs(remaining))} over budget`}
                      </span>
                      <span className="text-gray-400">{percentage.toFixed(1)}%</span>
                    </div>

                    {isOverBudget && (
                      <div className="flex items-center gap-2 text-red-400 text-sm">
                        <AlertTriangle className="h-4 w-4" />
                        <span>Over budget this month</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}