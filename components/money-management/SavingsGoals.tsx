"use client";

import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Target, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/utils/supabase/client";
import { useAuth } from "@/components/auth-provider";
import { formatZAR, parseZAR } from "@/utils/currency";
import toast from "react-hot-toast";
import { cn } from "@/utils/cn";

interface SavingsGoal {
  id: string;
  title: string;
  target_amount: number;
  current_amount: number;
  deadline?: string;
  completed: boolean;
  created_at: string;
}

interface SavingsGoalsProps {
  onDataChange: () => void;
}

export function SavingsGoals({ onDataChange }: SavingsGoalsProps) {
  const { user } = useAuth();
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    target_amount: "",
    current_amount: "",
    deadline: "",
  });

  const fetchGoals = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("savings_goals")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setGoals(data || []);
    } catch (error) {
      console.error("Error fetching savings goals:", error);
      toast.error("Failed to load savings goals");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, [user]);

  const resetForm = () => {
    setFormData({
      title: "",
      target_amount: "",
      current_amount: "",
      deadline: "",
    });
    setEditingGoal(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const targetAmount = parseZAR(formData.target_amount);
      const currentAmount = parseZAR(formData.current_amount);

      if (targetAmount <= 0) {
        toast.error("Target amount must be greater than 0");
        return;
      }

      if (currentAmount < 0) {
        toast.error("Current amount cannot be negative");
        return;
      }

      const goalData = {
        user_id: user.id,
        title: formData.title,
        target_amount: targetAmount,
        current_amount: currentAmount,
        deadline: formData.deadline || null,
        completed: currentAmount >= targetAmount,
      };

      if (editingGoal) {
        const { error } = await supabase
          .from("savings_goals")
          .update(goalData)
          .eq("id", editingGoal.id);

        if (error) throw error;
        toast.success("Savings goal updated");
      } else {
        const { error } = await supabase
          .from("savings_goals")
          .insert(goalData);

        if (error) throw error;
        toast.success("Savings goal added");
      }

      resetForm();
      fetchGoals();
      onDataChange();
    } catch (error) {
      console.error("Error saving savings goal:", error);
      toast.error("Failed to save savings goal");
    }
  };

  const handleEdit = (goal: SavingsGoal) => {
    setEditingGoal(goal);
    setFormData({
      title: goal.title,
      target_amount: formatZAR(goal.target_amount),
      current_amount: formatZAR(goal.current_amount),
      deadline: goal.deadline || "",
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this savings goal?")) return;

    try {
      const { error } = await supabase
        .from("savings_goals")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Savings goal deleted");
      fetchGoals();
      onDataChange();
    } catch (error) {
      console.error("Error deleting savings goal:", error);
      toast.error("Failed to delete savings goal");
    }
  };

  const updateProgress = async (goalId: string, newAmount: number) => {
    try {
      const goal = goals.find(g => g.id === goalId);
      const { error } = await supabase
        .from("savings_goals")
        .update({
          current_amount: newAmount,
          completed: goal ? newAmount >= goal.target_amount : false,
        })
        .eq("id", goalId);

      if (error) throw error;
      fetchGoals();
      onDataChange();
    } catch (error) {
      console.error("Error updating progress:", error);
      toast.error("Failed to update progress");
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
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Savings Goals
          </CardTitle>
          <Button onClick={() => setShowForm(!showForm)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Goal
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {showForm && (
          <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-card/50 rounded-lg border">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="title">Goal Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Porsche Fund"
                  required
                />
              </div>
              <div>
                <Label htmlFor="target_amount">Target Amount (ZAR)</Label>
                <Input
                  id="target_amount"
                  value={formData.target_amount}
                  onChange={(e) => setFormData({ ...formData, target_amount: e.target.value })}
                  placeholder="R500,000.00"
                  required
                />
              </div>
              <div>
                <Label htmlFor="current_amount">Current Amount (ZAR)</Label>
                <Input
                  id="current_amount"
                  value={formData.current_amount}
                  onChange={(e) => setFormData({ ...formData, current_amount: e.target.value })}
                  placeholder="R50,000.00"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="deadline">Target Deadline (Optional)</Label>
                <Input
                  id="deadline"
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit">
                {editingGoal ? "Update" : "Add"} Goal
              </Button>
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancel
              </Button>
            </div>
          </form>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goals.length === 0 ? (
            <div className="md:col-span-2 text-center py-8 text-gray-400">
              No savings goals yet. Add your first goal above.
            </div>
          ) : (
            goals.map((goal) => {
              const progress = (goal.current_amount / goal.target_amount) * 100;
              const isCompleted = goal.completed || progress >= 100;
              const isOverdue = goal.deadline && new Date(goal.deadline) < new Date() && !isCompleted;

              return (
                <Card key={goal.id} className={cn(
                  "relative overflow-hidden",
                  isCompleted && "border-green-500/50 bg-green-500/5",
                  isOverdue && "border-red-500/50 bg-red-500/5"
                )}>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-foreground">{goal.title}</h3>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(goal)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(goal.id)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Progress</span>
                          <span className="text-foreground">{progress.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div
                            className={cn(
                              "h-2 rounded-full transition-all duration-300",
                              isCompleted ? "bg-green-500" : "bg-blue-500"
                            )}
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-green-400">{formatZAR(goal.current_amount)}</span>
                          <span className="text-gray-400">{formatZAR(goal.target_amount)}</span>
                        </div>
                      </div>

                      {goal.deadline && (
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <Calendar className="h-3 w-3" />
                          <span>Target: {new Date(goal.deadline).toLocaleDateString()}</span>
                          {isOverdue && (
                            <span className="text-red-400 font-medium">Overdue</span>
                          )}
                        </div>
                      )}

                      {isCompleted && (
                        <div className="text-center text-green-400 font-medium text-sm">
                          ✓ Goal Achieved!
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}