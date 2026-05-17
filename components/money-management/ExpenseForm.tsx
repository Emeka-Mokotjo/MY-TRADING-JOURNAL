"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase/client";
import { useAuth } from "@/components/auth-provider";
import { EXPENSE_CATEGORIES, type ExpenseCategory, type ExpenseRecord, syncExpenseTransaction } from "@/utils/finance";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatZAR, parseZAR } from "@/utils/currency";
import toast from "react-hot-toast";

interface ExpenseFormProps {
  expenseToEdit: ExpenseRecord | null;
  onSaved: () => void;
  onEditCancelled: () => void;
}

interface FormState {
  title: string;
  category: ExpenseCategory;
  amount: string;
  linkedAccountId: string;
  expenseDate: string;
  description: string;
}

export function ExpenseForm({ expenseToEdit, onSaved, onEditCancelled }: ExpenseFormProps) {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<Array<{ id: string; account_name: string }>>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState<FormState>({
    title: "",
    category: EXPENSE_CATEGORIES[0],
    amount: "",
    linkedAccountId: "",
    expenseDate: new Date().toISOString().split("T")[0],
    description: "",
  });

  useEffect(() => {
    if (!user) return;
    supabase
      .from("capital_accounts")
      .select("id, account_name")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data) {
          setAccounts(data as Array<{ id: string; account_name: string }>);
        }
      });
  }, [user]);

  useEffect(() => {
    if (!expenseToEdit) {
      setForm((prev) => ({
        ...prev,
        title: "",
        category: EXPENSE_CATEGORIES[0],
        amount: "",
        linkedAccountId: "",
        expenseDate: new Date().toISOString().split("T")[0],
        description: "",
      }));
      return;
    }

    // Safely get the category, defaulting to first category if invalid
    const safeCategory = EXPENSE_CATEGORIES.includes(expenseToEdit.category as ExpenseCategory)
      ? expenseToEdit.category as ExpenseCategory
      : EXPENSE_CATEGORIES[0];

    setForm({
      title: expenseToEdit.title,
      category: safeCategory,
      amount: formatZAR(expenseToEdit.amount),
      linkedAccountId: expenseToEdit.linked_account_id || "",
      expenseDate: expenseToEdit.expense_date,
      description: expenseToEdit.description || "",
    });
  }, [expenseToEdit]);

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;

    const amount = parseZAR(form.amount);
    if (!form.title.trim() || amount <= 0 || !form.category) {
      toast.error("Please complete title, category and amount.");
      return;
    }

    setIsSubmitting(true);
    const payload = {
      user_id: user.id,
      title: form.title.trim(),
      category: form.category,
      amount,
      linked_account_id: form.linkedAccountId || null,
      description: form.description.trim() || null,
      expense_date: form.expenseDate,
    };

    try {
      if (expenseToEdit) {
        const { error } = await supabase
          .from("expenses")
          .update(payload)
          .eq("id", expenseToEdit.id)
          .eq("user_id", user.id);
        if (error) throw error;
        await syncExpenseTransaction(supabase, {
          id: expenseToEdit.id,
          ...payload,
          created_at: expenseToEdit.created_at,
        });
        toast.success("Expense updated successfully.");
      } else {
        const { data, error } = await supabase
          .from("expenses")
          .insert(payload)
          .select("id, created_at")
          .single();
        if (error) throw error;
        await syncExpenseTransaction(supabase, {
          id: data.id,
          ...payload,
          created_at: data.created_at,
        });
        toast.success("Expense added successfully.");
      }
      onSaved();
    } catch (error: any) {
      console.error("Error saving expense:", error);
      toast.error(error?.message || "Unable to save expense.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="rounded-[2rem] border-white/10 bg-card/80 p-6 shadow-[0_20px_80px_-40px_rgba(0,0,0,0.75)]">
      <CardHeader>
        <CardTitle>{expenseToEdit ? "Edit Expense" : "Log Expense"}</CardTitle>
        <CardDescription>
          Track every spend with category, linked account, and a clean ledger entry.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="expense-title">Title</Label>
              <Input
                id="expense-title"
                value={form.title}
                onChange={(event) => handleChange("title", event.target.value)}
                placeholder="Office software, subscription, or fee"
              />
            </div>
            <div>
              <Label htmlFor="expense-category">Category</Label>
              <select
                id="expense-category"
                value={form.category}
                onChange={(event) => handleChange("category", event.target.value)}
                className="flex h-10 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                {EXPENSE_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="expense-amount">Amount</Label>
              <Input
                id="expense-amount"
                placeholder="R500.00"
                value={form.amount}
                onChange={(event) => handleChange("amount", event.target.value)}
                inputMode="decimal"
              />
            </div>
            <div>
              <Label htmlFor="linked-account">Linked Account</Label>
              <select
                id="linked-account"
                value={form.linkedAccountId}
                onChange={(event) => handleChange("linkedAccountId", event.target.value)}
                className="flex h-10 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                <option value="">No linked account</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.account_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="expense-date">Date</Label>
              <Input
                id="expense-date"
                type="date"
                value={form.expenseDate}
                onChange={(event) => handleChange("expenseDate", event.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="expense-description">Description</Label>
              <Input
                id="expense-description"
                value={form.description}
                onChange={(event) => handleChange("description", event.target.value)}
                placeholder="Optional notes"
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-400">
              Expenses reduce wealth and adjust your capital footprint in real time.
            </p>
            <div className="flex gap-3 flex-wrap">
              {expenseToEdit && (
                <Button type="button" variant="outline" onClick={onEditCancelled} className="min-w-[120px]">
                  Cancel
                </Button>
              )}
              <Button type="submit" disabled={isSubmitting}>
                {expenseToEdit ? "Save Expense" : "Add Expense"}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
