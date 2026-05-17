import { SupabaseClient } from "@supabase/supabase-js";
import { calculateTotalCapital, getCapitalBreakdown } from "./capital";
import { getUserPayouts } from "./payouts";

export const EXPENSE_CATEGORIES = [
  "Trading Account Purchase",
  "Funded Account Fee",
  "Withdrawal / Cash Out",
  "Lifestyle Spending",
  "Bills",
  "Tools / Software",
  "Loss Coverage",
  "Internal Transfer",
  "Other",
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export interface ExpenseRecord {
  id: string;
  user_id: string;
  title: string;
  category: string;
  amount: number;
  linked_account_id: string | null;
  description: string | null;
  expense_date: string;
  created_at: string;
}

export interface ExternalIncomeEntry {
  id: string;
  user_id: string;
  title: string;
  source_type: string;
  amount: number;
  description: string | null;
  received_date: string;
  created_at: string;
}

export interface UnifiedTransaction {
  id: string;
  type: "Income" | "Expense" | "Transfer";
  date: string;
  title: string;
  category: string;
  amount: number;
  linkedAccount: string | null;
  rawType: string;
  currency?: string;
  raw: any;
}

function isTableMissingError(error: any) {
  return (
    error &&
    typeof error.message === "string" &&
    error.message.toLowerCase().includes("does not exist")
  );
}

async function upsertFinancialTransaction(
  supabase: SupabaseClient,
  transaction: {
    user_id: string;
    source_table: string;
    source_id: string;
    type: "Income" | "Expense" | "Transfer";
    category: string;
    title: string;
    amount: number;
    currency?: string;
    linked_account_id?: string | null;
    linked_account_name?: string | null;
    transaction_date: string;
    metadata?: Record<string, any>;
  }
): Promise<void> {
  try {
    const { error } = await supabase
      .from("financial_transactions")
      .upsert(
        {
          ...transaction,
          created_at: new Date().toISOString(),
        },
        { onConflict: "user_id,source_table,source_id" }
      );

    if (error) {
      if (isTableMissingError(error)) {
        return;
      }
      console.error("Error synchronizing financial transaction:", error);
    }
  } catch (error) {
    console.error("Error synchronizing financial transaction:", error);
  }
}

export async function deleteFinancialTransaction(
  supabase: SupabaseClient,
  userId: string,
  source_table: string,
  source_id: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from("financial_transactions")
      .delete()
      .eq("user_id", userId)
      .eq("source_table", source_table)
      .eq("source_id", source_id);

    if (error && !isTableMissingError(error)) {
      console.error("Error deleting financial transaction:", error);
    }
  } catch (error) {
    console.error("Error deleting financial transaction:", error);
  }
}

export async function syncExternalIncomeTransaction(
  supabase: SupabaseClient,
  income: ExternalIncomeEntry
): Promise<void> {
  await upsertFinancialTransaction(supabase, {
    user_id: income.user_id,
    source_table: "external_income",
    source_id: income.id,
    type: "Income",
    category: income.source_type || "External Income",
    title: income.title,
    amount: Number(income.amount),
    currency: "ZAR",
    linked_account_id: null,
    linked_account_name: null,
    transaction_date: income.received_date,
    metadata: {
      source_type: income.source_type,
      description: income.description,
    },
  });
}

export async function syncExpenseTransaction(
  supabase: SupabaseClient,
  expense: ExpenseRecord
): Promise<void> {
  await upsertFinancialTransaction(supabase, {
    user_id: expense.user_id,
    source_table: "expenses",
    source_id: expense.id,
    type: "Expense",
    category: expense.category,
    title: expense.title,
    amount: Number(expense.amount),
    currency: "ZAR",
    linked_account_id: expense.linked_account_id,
    linked_account_name: null,
    transaction_date: expense.expense_date,
    metadata: {
      description: expense.description,
    },
  });
}

export async function syncPayoutTransaction(
  supabase: SupabaseClient,
  payout: {
    id: string;
    user_id: string;
    account_id: string;
    amount: number;
    note: string | null;
    created_at: string;
  }
): Promise<void> {
  await upsertFinancialTransaction(supabase, {
    user_id: payout.user_id,
    source_table: "payouts",
    source_id: payout.id,
    type: "Income",
    category: "Trading Payout",
    title: payout.note || "Withdrawal from account",
    amount: Number(payout.amount),
    currency: "ZAR",
    linked_account_id: payout.account_id,
    linked_account_name: null,
    transaction_date: payout.created_at.split("T")[0],
    metadata: {
      note: payout.note,
    },
  });
}

export async function getUserExpenses(supabase: SupabaseClient, userId: string): Promise<ExpenseRecord[]> {
  if (!userId) return [];

  try {
    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .eq("user_id", userId)
      .order("expense_date", { ascending: false });

    if (error) {
      if (isTableMissingError(error)) {
        const { data: fallbackData } = await supabase
          .from("expense_entries")
          .select("id, user_id, title, amount, category, notes as description, spent_at as expense_date, created_at")
          .eq("user_id", userId)
          .order("spent_at", { ascending: false });
        return (fallbackData || []).map((item: any) => ({
          ...item,
          linked_account_id: null,
          expense_date: item.expense_date,
          amount: Number(item.amount),
        }));
      }
      console.error("Error loading user expenses:", error);
      return [];
    }

    return (data || []).map((item: any) => ({
      ...item,
      amount: Number(item.amount),
    }));
  } catch (error) {
    console.error("Error fetching user expenses:", error);
    return [];
  }
}

export async function getTotalExpenses(supabase: SupabaseClient, userId: string): Promise<number> {
  if (!userId) return 0;

  try {
    const { data, error } = await supabase
      .from("expenses")
      .select("amount")
      .eq("user_id", userId);

    if (error) {
      if (isTableMissingError(error)) {
        const { data: fallbackData } = await supabase
          .from("expense_entries")
          .select("amount")
          .eq("user_id", userId);
        return (fallbackData || []).reduce((sum, item: any) => sum + Number(item.amount), 0);
      }
      console.error("Error loading total expenses:", error);
      return 0;
    }

    return (data || []).reduce((sum, item: any) => sum + Number(item.amount), 0);
  } catch (error) {
    console.error("Error fetching total expenses:", error);
    return 0;
  }
}

export async function getMonthlyExpenses(
  supabase: SupabaseClient,
  userId: string,
  monthStart: string,
  monthEnd: string
): Promise<number> {
  if (!userId) return 0;

  try {
    const { data, error } = await supabase
      .from("expenses")
      .select("amount")
      .eq("user_id", userId)
      .gte("expense_date", monthStart)
      .lte("expense_date", monthEnd);

    if (error) {
      if (isTableMissingError(error)) {
        const { data: fallbackData } = await supabase
          .from("expense_entries")
          .select("amount")
          .eq("user_id", userId)
          .gte("spent_at", monthStart)
          .lte("spent_at", monthEnd);
        return (fallbackData || []).reduce((sum, item: any) => sum + Number(item.amount), 0);
      }
      console.error("Error loading monthly expenses:", error);
      return 0;
    }

    return (data || []).reduce((sum, item: any) => sum + Number(item.amount), 0);
  } catch (error) {
    console.error("Error fetching monthly expenses:", error);
    return 0;
  }
}

export async function getLargestExpenseCategory(
  supabase: SupabaseClient,
  userId: string
): Promise<{ category: string; total: number }> {
  const expenses = await getUserExpenses(supabase, userId);
  const totals = expenses.reduce((acc, entry) => {
    acc[entry.category] = (acc[entry.category] || 0) + Number(entry.amount);
    return acc;
  }, {} as Record<string, number>);
  const sorted = Object.entries(totals).sort((a, b) => b[1] - a[1]);
  return sorted.length > 0 ? { category: sorted[0][0], total: sorted[0][1] } : { category: "None", total: 0 };
}

export async function getTotalExternalIncome(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  if (!userId) return 0;

  try {
    const { data, error } = await supabase
      .from("external_income")
      .select("amount")
      .eq("user_id", userId);

    if (error) {
      console.error("Error loading external income total:", error);
      return 0;
    }
    return (data || []).reduce((sum, item: any) => sum + Number(item.amount), 0);
  } catch (error) {
    console.error("Error fetching external income total:", error);
    return 0;
  }
}

export async function getUserLedger(
  supabase: SupabaseClient,
  userId: string
): Promise<UnifiedTransaction[]> {
  try {
    const { data: transactionData, error: transactionError } = await supabase
      .from("financial_transactions")
      .select("*")
      .eq("user_id", userId)
      .order("transaction_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (!transactionError && transactionData && transactionData.length > 0) {
      return transactionData.map((item: any) => ({
        id: item.id,
        type: item.type,
        date: item.transaction_date,
        title: item.title,
        category: item.category,
        amount: Number(item.amount),
        linkedAccount: item.linked_account_name || item.linked_account_id || null,
        currency: item.currency || "ZAR",
        rawType: item.source_table || "financial_transactions",
        raw: item,
      }));
    }

    if (transactionError && !isTableMissingError(transactionError)) {
      console.error("Error loading financial transactions:", transactionError);
    }
  } catch (error) {
    console.error("Error checking financial transactions:", error);
  }

  const [expenses, { data: incomeData, error: incomeError }, payouts] = await Promise.all([
    getUserExpenses(supabase, userId),
    supabase.from("external_income").select("*").eq("user_id", userId).order("received_date", { ascending: false }),
    getUserPayouts(supabase, userId),
  ]);

  if (incomeError) {
    console.error("Error loading external income ledger:", incomeError);
  }

  const payoutTransactions = (payouts || []).map((item: any) => ({
    id: item.id,
    type: "Income" as const,
    date: item.created_at,
    title: item.note || "Withdrawal / Transfer",
    category: "Trading Payout",
    amount: Number(item.amount),
    linkedAccount: item.account_name || null,
    rawType: "payouts" as const,
    raw: item,
  }));

  const incomeTransactions = (incomeData || []).map((item: any) => ({
    id: item.id,
    type: "Income" as const,
    date: item.received_date,
    title: item.title,
    category: item.source_type || "External Income",
    amount: Number(item.amount),
    linkedAccount: null,
    rawType: "external_income" as const,
    raw: item,
  }));

  const expenseTransactions = expenses.map((entry) => ({
    id: entry.id,
    type: "Expense" as const,
    date: entry.expense_date,
    title: entry.title,
    category: entry.category,
    amount: Number(entry.amount),
    linkedAccount: entry.linked_account_id,
    rawType: "expenses" as const,
    raw: entry,
  }));

  const allTransactions = [...incomeTransactions, ...expenseTransactions, ...payoutTransactions];
  return allTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function getAccountExpensesTotal(
  supabase: SupabaseClient,
  accountId: string
): Promise<number> {
  if (!accountId) return 0;

  try {
    const { data, error } = await supabase
      .from("expenses")
      .select("amount")
      .eq("linked_account_id", accountId);

    if (error) {
      if (isTableMissingError(error)) {
        return 0;
      }
      console.error("Error loading account expenses total:", error);
      return 0;
    }
    return (data || []).reduce((sum, item: any) => sum + Number(item.amount), 0);
  } catch (error) {
    console.error("Error fetching account expenses total:", error);
    return 0;
  }
}

export async function getNetWealth(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  const [breakdown, externalIncome, totalExpenses] = await Promise.all([
    getCapitalBreakdown(supabase, userId),
    getTotalExternalIncome(supabase, userId),
    getTotalExpenses(supabase, userId),
  ]);
  return breakdown.totalCapital + externalIncome - totalExpenses;
}
