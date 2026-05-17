"use client";

import { useState, useEffect, useCallback, useMemo, type FormEvent } from "react";
import { StatCard } from "@/components/stat-card";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Target,
  AlertTriangle,
  Wallet,
  Edit2,
  Trash2,
} from "lucide-react";
import { supabase } from "@/utils/supabase/client";
import { useAuth } from "@/components/auth-provider";
import { formatZAR, parseZAR } from "@/utils/currency";
import { BalanceOverview } from "@/components/money-management/BalanceOverview";
import { SavingsGoals } from "@/components/money-management/SavingsGoals";
import { BudgetManager } from "@/components/money-management/BudgetManager";
import { SpendingAnalytics } from "@/components/money-management/SpendingAnalytics";
import { FinancialWarnings } from "@/components/money-management/FinancialWarnings";
import { TraderFinancialHealthScore } from "@/components/money-management/TraderFinancialHealthScore";
import { PayoutImportSection } from "@/components/money-management/PayoutImportSection";
import { NetWorthOverview } from "@/components/money-management/NetWorthOverview";
import { RecurringExpenses } from "@/components/money-management/RecurringExpenses";
import { EmergencyFundTracker } from "@/components/money-management/EmergencyFundTracker";
import { WealthReportSection } from "@/components/money-management/WealthReportSection";
import { WealthHeatmapCalendar } from "@/components/money-management/WealthHeatmapCalendar";
import { AllocationRulesManager } from "@/components/money-management/AllocationRulesManager";
import { ExpenseForm } from "@/components/money-management/ExpenseForm";
import { UnifiedLedger } from "@/components/money-management/UnifiedLedger";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import Link from "next/link";
import { Calendar } from "lucide-react";
import toast from "react-hot-toast";
import {
  getTotalExpenses,
  getLargestExpenseCategory,
  getTotalExternalIncome,
  getMonthlyExpenses,
  getUserLedger,
  deleteFinancialTransaction,
  syncExternalIncomeTransaction,
  type ExpenseRecord,
  type UnifiedTransaction,
} from "@/utils/finance";

interface MoneyManagementStats {
  totalPersonalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  savingsProgress: number;
  totalSavings: number;
  monthlyBudgetUsage: number;
  totalTradingPayouts: number;
  expenseIncreasePercent: number;
  capitalProtectionRisk: boolean;
  drawdownPercent: number;
  netWorth: number;
  retentionRate: number;
  emergencyFundStrength: number;
  tradingCapital: number;
  spendableCash: number;
  longTermWealth: number;
  financialHealthScore: number;
  unnecessaryExpenses: number;
  externalIncomeTotal: number;
  externalIncomeThisMonth: number;
  totalExpenses: number;
  largestExpenseCategory: string;
  largestExpenseAmount: number;
  largestExternalSource: string;
  largestExternalAmount: number;
  totalNetWealth: number;
}

const EXTERNAL_SOURCE_OPTIONS = [
  "Roulette",
  "Salary",
  "Freelance",
  "Business",
  "Crypto",
  "Gift",
  "Side Hustle",
  "Investment",
  "Other",
];

interface ExternalIncomeEntry {
  id: string;
  user_id: string;
  title: string;
  source_type: string;
  amount: number;
  description: string | null;
  received_date: string;
  created_at: string;
}

const currencyInputFormatter = (value: string) => {
  const cleaned = value.replace(/[^0-9.]/g, "");
  const [integerPart, decimalPart] = cleaned.split(".");
  const normalizedInt = integerPart || "";
  const formattedInt = normalizedInt ? Number(normalizedInt).toLocaleString("en-ZA") : "";
  if (decimalPart !== undefined) {
    return `${formattedInt}${formattedInt && decimalPart.length > 0 ? "." : ""}${decimalPart.slice(0, 2)}`;
  }
  return formattedInt;
};

const getCurrentMonthId = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

export default function MoneyManagementPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<MoneyManagementStats>({
    totalPersonalBalance: 0,
    monthlyIncome: 0,
    monthlyExpenses: 0,
    savingsProgress: 0,
    totalSavings: 0,
    monthlyBudgetUsage: 0,
    totalTradingPayouts: 0,
    expenseIncreasePercent: 0,
    capitalProtectionRisk: false,
    drawdownPercent: 0,
    netWorth: 0,
    retentionRate: 0,
    emergencyFundStrength: 0,
    tradingCapital: 0,
    spendableCash: 0,
    longTermWealth: 0,
    financialHealthScore: 0,
    unnecessaryExpenses: 0,
    externalIncomeTotal: 0,
    externalIncomeThisMonth: 0,
    totalExpenses: 0,
    largestExpenseCategory: "None",
    largestExpenseAmount: 0,
    largestExternalSource: "None",
    largestExternalAmount: 0,
    totalNetWealth: 0,
  });
  const [externalEntries, setExternalEntries] = useState<ExternalIncomeEntry[]>([]);
  const [ledgerEntries, setLedgerEntries] = useState<UnifiedTransaction[]>([]);
  const [expenseToEdit, setExpenseToEdit] = useState<ExpenseRecord | null>(null);
  const [filterSource, setFilterSource] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonthId());
  const [editingEntry, setEditingEntry] = useState<ExternalIncomeEntry | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [incomeForm, setIncomeForm] = useState({
    title: "",
    sourceType: "Salary",
    amount: "",
    receivedDate: new Date().toISOString().split("T")[0],
    description: "",
  });

  const fetchExternalEntries = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from("external_income")
        .select("*")
        .eq("user_id", user.id)
        .order("received_date", { ascending: false });
      if (data) {
        setExternalEntries(
          data.map((entry: any) => ({
            ...entry,
            amount: Number(entry.amount),
          }))
        );
      }
    } catch (error) {
      console.error("Error loading external income entries:", error);
    }
  }, [user]);

  const fetchLedger = useCallback(async () => {
    if (!user) return;
    try {
      const ledger = await getUserLedger(supabase, user.id);
      setLedgerEntries(ledger);
    } catch (error) {
      console.error("Error loading ledger entries:", error);
    }
  }, [user]);

  const handleDeleteExpense = async (transaction: UnifiedTransaction) => {
    if (!user) return;
    if (!window.confirm("Delete this expense entry?")) return;

    try {
      const { error } = await supabase
        .from("expenses")
        .delete()
        .eq("id", transaction.id)
        .eq("user_id", user.id);

      if (error) throw error;
      toast.success("Expense deleted.");
      await fetchStats();
      await fetchLedger();
    } catch (error: any) {
      console.error("Error deleting expense entry:", error);
      toast.error(error?.message || "Unable to delete expense entry.");
    }
  };

  const handleEditExpense = (transaction: UnifiedTransaction) => {
    setExpenseToEdit(transaction.raw as ExpenseRecord);
  };

  const hydrateExternalIncomeStats = async (
    baseStats: Partial<MoneyManagementStats> = {},
    totalExpenses = 0
  ) => {
    if (!user) return baseStats;

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const monthStartDate = monthStart.toISOString().split("T")[0];
    const monthEndDate = monthEnd.toISOString().split("T")[0];

    const { data: allExternal } = await supabase
      .from("external_income")
      .select("amount, source_type, received_date")
      .eq("user_id", user.id);

    const totalExternalIncome = allExternal?.reduce((sum, item) => sum + Number(item.amount), 0) || 0;
    const externalThisMonth = allExternal
      ?.filter((item) => item.received_date >= monthStartDate && item.received_date <= monthEndDate)
      .reduce((sum, item) => sum + Number(item.amount), 0) || 0;

    const categoryTotals = (allExternal || []).reduce((acc: Record<string, number>, item) => {
      acc[item.source_type] = (acc[item.source_type] || 0) + Number(item.amount);
      return acc;
    }, {});

    const largestSourceEntry = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0] || ["None", 0];
    const totalNetWealth = (baseStats.tradingCapital || 0) + (baseStats.spendableCash || 0) + totalExternalIncome - totalExpenses;

    return {
      ...baseStats,
      externalIncomeTotal: totalExternalIncome,
      externalIncomeThisMonth: externalThisMonth,
      largestExternalSource: largestSourceEntry[0],
      largestExternalAmount: largestSourceEntry[1],
      totalNetWealth,
    } as MoneyManagementStats;
  };

  const resetForm = () => {
    setIncomeForm({
      title: "",
      sourceType: "Salary",
      amount: "",
      receivedDate: new Date().toISOString().split("T")[0],
      description: "",
    });
    setEditingEntry(null);
  };

  const handleFormChange = (field: string, value: string) => {
    setIncomeForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;
    const amount = parseZAR(incomeForm.amount);
    if (!incomeForm.title.trim() || !incomeForm.sourceType || amount <= 0) {
      toast.error("Please complete the title, source type and amount.");
      return;
    }

    setIsSubmitting(true);
    const payload = {
      user_id: user.id,
      title: incomeForm.title.trim(),
      source_type: incomeForm.sourceType,
      amount,
      description: incomeForm.description.trim() || null,
      received_date: incomeForm.receivedDate,
    };

    try {
      if (editingEntry) {
        const { error } = await supabase
          .from("external_income")
          .update(payload)
          .eq("id", editingEntry.id)
          .eq("user_id", user.id);
        if (error) throw error;
        await syncExternalIncomeTransaction(supabase, {
          id: editingEntry.id,
          ...payload,
          created_at: editingEntry.created_at,
        });
        toast.success("External income updated.");
      } else {
        const { data, error } = await supabase
          .from("external_income")
          .insert(payload)
          .select("id, created_at")
          .single();
        if (error) throw error;
        if (data?.id) {
          await syncExternalIncomeTransaction(supabase, {
            id: data.id,
            ...payload,
            created_at: data.created_at,
          });
        }
        toast.success("External income added.");
      }
      resetForm();
      await fetchStats();
      await fetchExternalEntries();
      await fetchLedger();
    } catch (error: any) {
      console.error("Error saving external income:", error);
      toast.error(error?.message || "Unable to save external income.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditEntry = (entry: ExternalIncomeEntry) => {
    setEditingEntry(entry);
    setIncomeForm({
      title: entry.title,
      sourceType: entry.source_type,
      amount: entry.amount.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      receivedDate: entry.received_date,
      description: entry.description || "",
    });
  };

  const handleDeleteEntry = async (entry: ExternalIncomeEntry) => {
    if (!user) return;
    const confirmed = window.confirm("Delete this external income entry?");
    if (!confirmed) return;

    try {
      const { error } = await supabase.from("external_income").delete().eq("id", entry.id).eq("user_id", user.id);
      if (error) throw error;
      await deleteFinancialTransaction(supabase, user.id, "external_income", entry.id);
      toast.success("Entry deleted.");
      await fetchStats();
      await fetchExternalEntries();
      await fetchLedger();
    } catch (error: any) {
      console.error("Error deleting external income:", error);
      toast.error(error?.message || "Unable to delete entry.");
    }
  };

  const categoryTotals = useMemo(() => {
    return externalEntries.reduce((acc: Record<string, number>, entry) => {
      acc[entry.source_type] = (acc[entry.source_type] || 0) + Number(entry.amount);
      return acc;
    }, {});
  }, [externalEntries]);

  const monthTrend = useMemo(() => {
    const trendMap: Record<string, number> = {};
    const now = new Date();
    for (let offset = 5; offset >= 0; offset--) {
      const month = new Date(now.getFullYear(), now.getMonth() - offset, 1);
      const monthKey = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}`;
      trendMap[monthKey] = 0;
    }
    externalEntries.forEach((entry) => {
      const monthKey = entry.received_date.slice(0, 7);
      if (trendMap[monthKey] !== undefined) {
        trendMap[monthKey] += Number(entry.amount);
      }
    });
    return Object.entries(trendMap).map(([month, amount]) => ({
      month,
      amount,
      label: new Intl.DateTimeFormat("en-ZA", { month: "short", year: "2-digit" }).format(new Date(`${month}-01`)),
    }));
  }, [externalEntries]);

  const filteredEntries = useMemo(() => {
    return externalEntries.filter((entry) => {
      const matchesSource = filterSource === "All" || entry.source_type === filterSource;
      const matchesSearch = [entry.title, entry.source_type, entry.description || ""].some((field) =>
        field.toLowerCase().includes(searchQuery.toLowerCase())
      );
      const monthKey = entry.received_date.slice(0, 7);
      const matchesMonth = selectedMonth === "All" || monthKey === selectedMonth;
      return matchesSource && matchesSearch && matchesMonth;
    });
  }, [externalEntries, filterSource, searchQuery, selectedMonth]);

  const monthOptions = useMemo(() => {
    const now = new Date();
    const options = [{ value: "All", label: "All months" }];
    for (let offset = 0; offset < 6; offset++) {
      const month = new Date(now.getFullYear(), now.getMonth() - offset, 1);
      options.push({
        value: `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}`,
        label: new Intl.DateTimeFormat("en-ZA", { month: "short", year: "numeric" }).format(month),
      });
    }
    return options;
  }, []);

  const externalShare = useMemo(() => {
    const totalPerformance = stats.monthlyIncome + stats.totalTradingPayouts;
    return totalPerformance > 0 ? Math.min(100, (stats.externalIncomeThisMonth / totalPerformance) * 100) : 0;
  }, [stats.externalIncomeThisMonth, stats.monthlyIncome, stats.totalTradingPayouts]);

  const fetchStats = useCallback(async () => {
    if (!user) return;

    try {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      const monthStartDate = monthStart.toISOString().split('T')[0];
      const monthEndDate = monthEnd.toISOString().split('T')[0];
      const prevMonthStartDate = previousMonthStart.toISOString().split('T')[0];
      const prevMonthEndDate = previousMonthEnd.toISOString().split('T')[0];

      const [
        { data: incomeData },
        { data: expenseData },
        { data: monthlyIncomeData },
        { data: monthlyExpenseData },
        { data: previousExpenseData },
        { data: newExpensesData },
        { data: monthlyNewExpensesData },
        { data: previousNewExpensesData },
        { data: payoutData },
        { data: monthlyPayoutData },
        { data: previousPayoutData },
        { data: savingsData },
        { data: budgetData },
        { data: assetsData },
        { data: liabilitiesData },
        { data: accountData },
        { data: fundData },
      ] = await Promise.all([
        supabase.from("income_entries").select("amount").eq("user_id", user.id),
        supabase.from("expense_entries").select("amount, necessity_level").eq("user_id", user.id),
        supabase
          .from("income_entries")
          .select("amount")
          .eq("user_id", user.id)
          .gte("received_at", monthStartDate)
          .lte("received_at", monthEndDate),
        supabase
          .from("expense_entries")
          .select("amount, necessity_level")
          .eq("user_id", user.id)
          .gte("spent_at", monthStartDate)
          .lte("spent_at", monthEndDate),
        supabase
          .from("expense_entries")
          .select("amount")
          .eq("user_id", user.id)
          .gte("spent_at", prevMonthStartDate)
          .lte("spent_at", prevMonthEndDate),
        supabase.from("expenses").select("amount").eq("user_id", user.id),
        supabase
          .from("expenses")
          .select("amount")
          .eq("user_id", user.id)
          .gte("expense_date", monthStartDate)
          .lte("expense_date", monthEndDate),
        supabase
          .from("expenses")
          .select("amount")
          .eq("user_id", user.id)
          .gte("expense_date", prevMonthStartDate)
          .lte("expense_date", prevMonthEndDate),
        supabase.from("payouts").select("amount").eq("user_id", user.id),
        supabase
          .from("payouts")
          .select("amount")
          .eq("user_id", user.id)
          .gte("created_at", monthStartDate)
          .lte("created_at", monthEndDate),
        supabase
          .from("payouts")
          .select("amount")
          .eq("user_id", user.id)
          .gte("created_at", prevMonthStartDate)
          .lte("created_at", prevMonthEndDate),
        supabase.from("savings_goals").select("current_amount, target_amount").eq("user_id", user.id),
        supabase.from("budgets").select("monthly_limit").eq("user_id", user.id),
        supabase.from("assets").select("value").eq("user_id", user.id),
        supabase.from("liabilities").select("value").eq("user_id", user.id),
        supabase.from("capital_accounts").select("account_type, balance").eq("user_id", user.id),
        supabase.from("emergency_fund_targets").select("current_balance, target_balance").eq("user_id", user.id).maybeSingle(),
      ]);

      const totalIncome = incomeData?.reduce((sum, item) => sum + Number(item.amount), 0) || 0;
      const oldExpensesTotal = expenseData?.reduce((sum, item) => sum + Number(item.amount), 0) || 0;
      const newExpensesTotal = newExpensesData?.reduce((sum, item) => sum + Number(item.amount), 0) || 0;
      const totalExpenses = oldExpensesTotal + newExpensesTotal;
      const totalPersonalBalance = totalIncome - totalExpenses;

      const monthlyIncome = monthlyIncomeData?.reduce((sum, item) => sum + Number(item.amount), 0) || 0;
      const monthlyExpenses =
        (monthlyExpenseData?.reduce((sum, item) => sum + Number(item.amount), 0) || 0) +
        (monthlyNewExpensesData?.reduce((sum, item) => sum + Number(item.amount), 0) || 0);
      const previousMonthExpenses =
        (previousExpenseData?.reduce((sum, item) => sum + Number(item.amount), 0) || 0) +
        (previousNewExpensesData?.reduce((sum, item) => sum + Number(item.amount), 0) || 0);

      const totalCurrentSavings = savingsData?.reduce((sum, goal) => sum + Number(goal.current_amount), 0) || 0;
      const totalTargetSavings = savingsData?.reduce((sum, goal) => sum + Number(goal.target_amount), 0) || 0;
      const savingsProgress = totalTargetSavings > 0 ? (totalCurrentSavings / totalTargetSavings) * 100 : 0;

      const totalMonthlyBudget = budgetData?.reduce((sum, budget) => sum + Number(budget.monthly_limit), 0) || 0;
      const monthlyBudgetUsage = totalMonthlyBudget > 0 ? (monthlyExpenses / totalMonthlyBudget) * 100 : 0;

      const totalTradingPayouts = payoutData?.reduce((sum, payout) => sum + Number(payout.amount), 0) || 0;
      const currentMonthPayouts = monthlyPayoutData?.reduce((sum, payout) => sum + Number(payout.amount), 0) || 0;
      const previousMonthPayouts = previousPayoutData?.reduce((sum, payout) => sum + Number(payout.amount), 0) || 0;

      const totalAssets = assetsData?.reduce((sum, item) => sum + Number(item.value), 0) || 0;
      const totalLiabilities = liabilitiesData?.reduce((sum, item) => sum + Number(item.value), 0) || 0;
      const netWorth = totalAssets - totalLiabilities;

      const personalBalance = accountData?.reduce((sum, account) => sum + (account.account_type === "personal" ? Number(account.balance) : 0), 0) || 0;
      const fundedBalance = accountData?.reduce((sum, account) => sum + (account.account_type === "funded" ? Number(account.balance) : 0), 0) || 0;

      const expenseIncreasePercent = previousMonthExpenses > 0 ? ((monthlyExpenses - previousMonthExpenses) / previousMonthExpenses) * 100 : monthlyExpenses > 0 ? 100 : 0;
      const drawdownPercent = previousMonthPayouts > 0 ? ((previousMonthPayouts - currentMonthPayouts) / previousMonthPayouts) * 100 : 0;
      const capitalProtectionRisk = drawdownPercent > 20 && monthlyExpenses > monthlyIncome;
      const unnecessaryExpenses = monthlyExpenseData?.reduce((sum, item: any) => item.necessity_level === "non_essential" ? sum + Number(item.amount) : sum, 0) || monthlyExpenses * 0.3;
      const emergencyFundStrength = fundData ? Math.min(100, (Number(fundData.current_balance) / Math.max(1, Number(fundData.target_balance))) * 100) : 0;
      const retentionRate = totalTradingPayouts > 0 ? Math.min(100, (netWorth / totalTradingPayouts) * 100) : 0;

      const savingsScore = Math.min(savingsProgress, 100);
      const disciplineScore = monthlyBudgetUsage <= 100 ? 100 - monthlyBudgetUsage : 0;
      const budgetScore = monthlyBudgetUsage <= 100 ? 100 : 50;
      const retentionScore = Math.min(retentionRate, 100);
      const emergencyScore = Math.min(emergencyFundStrength, 100);
      const expensePenalty = Math.min((unnecessaryExpenses / Math.max(1, Math.abs(netWorth || totalPersonalBalance))) * 100, 30);
      const financialHealthScore = Math.max(
        0,
        Math.min(
          100,
          savingsScore * 0.25 +
            disciplineScore * 0.2 +
            budgetScore * 0.2 +
            retentionScore * 0.2 +
            emergencyScore * 0.15 -
            expensePenalty * 0.15
        )
      );

      const largestExpense = await getLargestExpenseCategory(supabase, user.id);
      const enrichedStats = await hydrateExternalIncomeStats({
        totalPersonalBalance,
        monthlyIncome,
        monthlyExpenses,
        savingsProgress,
        totalSavings: totalCurrentSavings,
        monthlyBudgetUsage,
        totalTradingPayouts,
        expenseIncreasePercent,
        capitalProtectionRisk,
        drawdownPercent,
        netWorth,
        retentionRate,
        emergencyFundStrength,
        tradingCapital: fundedBalance,
        spendableCash: personalBalance,
        longTermWealth: netWorth,
        financialHealthScore,
        unnecessaryExpenses,
      }, totalExpenses);

      setStats({
        totalPersonalBalance: enrichedStats.totalPersonalBalance || 0,
        monthlyIncome: enrichedStats.monthlyIncome || 0,
        monthlyExpenses: enrichedStats.monthlyExpenses || 0,
        savingsProgress: enrichedStats.savingsProgress || 0,
        totalSavings: enrichedStats.totalSavings || 0,
        monthlyBudgetUsage: enrichedStats.monthlyBudgetUsage || 0,
        totalTradingPayouts: enrichedStats.totalTradingPayouts || 0,
        expenseIncreasePercent: enrichedStats.expenseIncreasePercent || 0,
        capitalProtectionRisk: enrichedStats.capitalProtectionRisk || false,
        drawdownPercent: enrichedStats.drawdownPercent || 0,
        netWorth: enrichedStats.netWorth || 0,
        retentionRate: enrichedStats.retentionRate || 0,
        emergencyFundStrength: enrichedStats.emergencyFundStrength || 0,
        tradingCapital: enrichedStats.tradingCapital || 0,
        spendableCash: enrichedStats.spendableCash || 0,
        longTermWealth: enrichedStats.longTermWealth || 0,
        financialHealthScore: enrichedStats.financialHealthScore || 0,
        unnecessaryExpenses: enrichedStats.unnecessaryExpenses || 0,
        externalIncomeTotal: enrichedStats.externalIncomeTotal || 0,
        externalIncomeThisMonth: enrichedStats.externalIncomeThisMonth || 0,
        totalExpenses,
        largestExpenseCategory: largestExpense.category,
        largestExpenseAmount: largestExpense.total,
        largestExternalSource: enrichedStats.largestExternalSource || "None",
        largestExternalAmount: enrichedStats.largestExternalAmount || 0,
        totalNetWealth: enrichedStats.totalNetWealth || 0,
      });
    } catch (error) {
      console.error("Error fetching money management stats:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchStats();
    fetchExternalEntries();
    fetchLedger();

    // Set up realtime subscriptions
    if (user) {
      const externalSubscription = supabase
        .channel('external_income')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'external_income',
          filter: `user_id=eq.${user.id}`,
        }, () => {
          fetchStats();
          fetchExternalEntries();
          fetchLedger();
        })
        .subscribe();

      const incomeSubscription = supabase
        .channel('income_entries')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'income_entries',
          filter: `user_id=eq.${user.id}`,
        }, () => {
          fetchStats();
        })
        .subscribe();

      const expenseSubscription = supabase
        .channel('expense_entries')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'expense_entries',
          filter: `user_id=eq.${user.id}`,
        }, () => {
          fetchStats();
        })
        .subscribe();

      const expensesSubscription = supabase
        .channel('expenses')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'expenses',
          filter: `user_id=eq.${user.id}`,
        }, () => {
          fetchStats();
          fetchLedger();
        })
        .subscribe();

      const savingsSubscription = supabase
        .channel('savings_goals')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'savings_goals',
          filter: `user_id=eq.${user.id}`,
        }, () => {
          fetchStats();
        })
        .subscribe();

      const budgetSubscription = supabase
        .channel('budgets')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'budgets',
          filter: `user_id=eq.${user.id}`,
        }, () => {
          fetchStats();
        })
        .subscribe();

      const payoutSubscription = supabase
        .channel('payouts')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'payouts',
          filter: `user_id=eq.${user.id}`,
        }, () => {
          fetchStats();
        })
        .subscribe();

      const transactionSubscription = supabase
        .channel('financial_transactions')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'financial_transactions',
          filter: `user_id=eq.${user.id}`,
        }, () => {
          fetchStats();
          fetchLedger();
        })
        .subscribe();

      // Cleanup subscriptions on unmount
      return () => {
        externalSubscription.unsubscribe();
        incomeSubscription.unsubscribe();
        expenseSubscription.unsubscribe();
        expensesSubscription.unsubscribe();
        savingsSubscription.unsubscribe();
        budgetSubscription.unsubscribe();
        payoutSubscription.unsubscribe();
        transactionSubscription.unsubscribe();
      };
    }
  }, [fetchStats, fetchExternalEntries, fetchLedger, user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Money Management</h1>
          <p className="text-gray-400 mt-2">
            Take control of your personal finances and build wealth discipline
          </p>
        </div>
        <Link href="/money-management/calendar">
          <Button className="gap-2" variant="outline">
            <Calendar className="w-4 h-4" />
            Activity Calendar
          </Button>
        </Link>
      </div>

      {/* External Income Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard
          title="Total External Income"
          value={formatZAR(stats.externalIncomeTotal)}
          icon={DollarSign}
          trend={stats.externalIncomeTotal >= 0 ? "positive" : "negative"}
        />
        <StatCard
          title="This Month External Income"
          value={formatZAR(stats.externalIncomeThisMonth)}
          icon={TrendingUp}
        />
        <StatCard
          title="Largest Income Source"
          value={`${stats.largestExternalSource} • ${formatZAR(stats.largestExternalAmount)}`}
          icon={PiggyBank}
        />
        <StatCard
          title="Total Net Wealth"
          value={formatZAR(stats.totalNetWealth)}
          icon={Wallet}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_1fr] gap-6">
        <Card className="rounded-[2rem] border-white/10 bg-card/80 p-6 shadow-[0_20px_80px_-40px_rgba(0,0,0,0.75)]">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-foreground">Add External Income</h2>
              <p className="text-sm text-slate-400 mt-1">
                Log external cash flow that belongs to your wealth ecosystem while keeping trading analytics separate.
              </p>
            </div>
            <div className="rounded-2xl bg-white/5 px-3 py-2 text-sm text-slate-300">
              Currency: ZAR (R)
            </div>
          </div>

          <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="income-title">Income Title</Label>
                <Input
                  id="income-title"
                  placeholder="Weekend Roulette Session"
                  value={incomeForm.title}
                  onChange={(event) => handleFormChange("title", event.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="source-type">Source Type</Label>
                <select
                  id="source-type"
                  value={incomeForm.sourceType}
                  onChange={(event) => handleFormChange("sourceType", event.target.value)}
                  className="flex h-10 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  {EXTERNAL_SOURCE_OPTIONS.map((source) => (
                    <option key={source} value={source}>
                      {source}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  placeholder="12,500.00"
                  value={incomeForm.amount}
                  onChange={(event) => handleFormChange("amount", currencyInputFormatter(event.target.value))}
                  inputMode="decimal"
                />
              </div>
              <div>
                <Label htmlFor="received-date">Date Received</Label>
                <Input
                  id="received-date"
                  type="date"
                  value={incomeForm.receivedDate}
                  onChange={(event) => handleFormChange("receivedDate", event.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                rows={4}
                placeholder="Optional notes about the income source"
                value={incomeForm.description}
                onChange={(event) => handleFormChange("description", event.target.value)}
                className="mt-2 w-full rounded-md border border-border bg-card px-3 py-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-400">
                You can edit or remove income entries later from your history table.
              </p>
              <div className="flex gap-3 flex-wrap">
                {editingEntry && (
                  <Button type="button" variant="outline" onClick={resetForm} className="min-w-[120px]">
                    Cancel edit
                  </Button>
                )}
                <Button type="submit" disabled={isSubmitting}>
                  {editingEntry ? "Save Income" : "Add Income"}
                </Button>
              </div>
            </div>
          </form>
        </Card>

        <div className="space-y-6">
          <Card className="rounded-[2rem] border-white/10 bg-card/80 p-6 shadow-[0_20px_80px_-40px_rgba(0,0,0,0.75)]">
            <CardHeader className="pb-2">
              <CardTitle>Income Breakdown</CardTitle>
              <CardDescription>Category impact across logged external income.</CardDescription>
            </CardHeader>
            <CardContent className="h-[320px]">
              {Object.values(categoryTotals).filter((value) => value > 0).length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={Object.entries(categoryTotals).map(([name, value]) => ({ name, value }))}
                      dataKey="value"
                      nameKey="name"
                      outerRadius={110}
                      innerRadius={48}
                      paddingAngle={4}
                    >
                      {Object.entries(categoryTotals).map(([name], index) => (
                        <Cell
                          key={name}
                          fill={["#7c3aed", "#22c55e", "#38bdf8", "#f59e0b", "#ef4444", "#8b5cf6", "#14b8a6", "#f97316", "#0ea5e9"][index % 9]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1f2937', color: '#f8fafc' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-slate-500">
                  No external income logged yet.
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-[2rem] border-white/10 bg-card/80 p-6 shadow-[0_20px_80px_-40px_rgba(0,0,0,0.75)]">
            <CardHeader className="pb-2">
              <CardTitle>Monthly Income Trend</CardTitle>
              <CardDescription>Track external income growth over the last six months.</CardDescription>
            </CardHeader>
            <CardContent className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthTrend} margin={{ top: 12, right: 8, left: -12, bottom: 0 }}>
                  <CartesianGrid stroke="#1f2937" strokeDasharray="3 3" />
                  <XAxis dataKey="label" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1f2937', color: '#f8fafc' }} />
                  <Line type="monotone" dataKey="amount" stroke="#34d399" strokeWidth={3} dot={{ r: 4, stroke: '#ffffff', strokeWidth: 2, fill: '#34d399' }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="rounded-[2rem] border-white/10 bg-card/80 p-6 shadow-[0_20px_80px_-40px_rgba(0,0,0,0.75)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Income History</h2>
            <p className="text-sm text-slate-400 mt-1">
              Review every external income entry with filters, search and edit controls.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="inline-flex rounded-full border border-white/10 bg-white/5 p-1">
              {['All', ...EXTERNAL_SOURCE_OPTIONS].map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setFilterSource(option)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition ${filterSource === option ? 'bg-primary text-black' : 'text-slate-300 hover:bg-white/5'}`}
                >
                  {option}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <select
                value={selectedMonth}
                onChange={(event) => setSelectedMonth(event.target.value)}
                className="h-10 rounded-md border border-border bg-card px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                {monthOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <Input
                placeholder="Search income"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="min-w-[220px]"
              />
            </div>
          </div>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-slate-500">
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Source Type</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filteredEntries.length > 0 ? (
                filteredEntries.map((entry) => (
                  <tr key={entry.id} className="transition hover:bg-white/5">
                    <td className="px-4 py-4 text-slate-300">{entry.received_date}</td>
                    <td className="px-4 py-4 font-medium text-foreground">{entry.title}</td>
                    <td className="px-4 py-4 text-slate-400">{entry.source_type}</td>
                    <td className="px-4 py-4 text-slate-200">{formatZAR(entry.amount)}</td>
                    <td className="px-4 py-4 text-slate-400 max-w-[280px] truncate">{entry.description || '-'}</td>
                    <td className="px-4 py-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleEditEntry(entry)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteEntry(entry)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-300 transition hover:bg-red-500/15"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                    No income entries match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-6 rounded-[1.75rem] border border-white/10 bg-white/5 p-5 text-sm text-slate-300">
          <p className="font-semibold text-slate-100 mb-2">Quick insight</p>
          <p>
            Your external income covered <span className="font-semibold text-emerald-300">{externalShare.toFixed(0)}%</span> of this month’s total realized income.
          </p>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <ExpenseForm
          expenseToEdit={expenseToEdit}
          onSaved={async () => {
            setExpenseToEdit(null);
            await fetchStats();
            await fetchLedger();
          }}
          onEditCancelled={() => setExpenseToEdit(null)}
        />

        <UnifiedLedger
          transactions={ledgerEntries}
          onEditIncome={(transaction) => {
            handleEditEntry(transaction.raw as ExternalIncomeEntry);
          }}
          onDeleteIncome={async (transaction) => {
            const entry = transaction.raw as ExternalIncomeEntry;
            const confirmed = window.confirm("Delete this external income entry?");
            if (!confirmed || !user) return;
            const { error } = await supabase.from("external_income").delete().eq("id", entry.id).eq("user_id", user.id);
            if (error) {
              toast.error(error.message || "Unable to delete income entry.");
              return;
            }
            toast.success("Income deleted.");
            await fetchStats();
            await fetchExternalEntries();
            await fetchLedger();
          }}
          onEditExpense={(transaction) => handleEditExpense(transaction)}
          onDeleteExpense={handleDeleteExpense}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          title="Total Personal Balance"
          value={formatZAR(stats.totalPersonalBalance)}
          icon={Wallet}
          trend={stats.totalPersonalBalance >= 0 ? "positive" : "negative"}
        />
        <StatCard
          title="Monthly Income"
          value={formatZAR(stats.monthlyIncome)}
          icon={TrendingUp}
        />
        <StatCard
          title="Monthly Expenses"
          value={formatZAR(stats.monthlyExpenses)}
          icon={TrendingDown}
        />
        <StatCard
          title="Savings Progress"
          value={`${stats.savingsProgress.toFixed(1)}%`}
          icon={PiggyBank}
        />
        <StatCard
          title="Monthly Budget Usage"
          value={`${stats.monthlyBudgetUsage.toFixed(1)}%`}
          icon={Target}
        />
        <StatCard
          title="Total Trading Payouts"
          value={formatZAR(stats.totalTradingPayouts)}
          icon={DollarSign}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-6">
        <BalanceOverview
          tradingCapital={stats.tradingCapital}
          spendableCash={stats.spendableCash}
          longTermWealth={stats.longTermWealth}
        />
        <AllocationRulesManager onRulesUpdate={fetchStats} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <FinancialWarnings
          monthlyIncome={stats.monthlyIncome}
          monthlyExpenses={stats.monthlyExpenses}
          totalIncome={stats.monthlyIncome + stats.totalTradingPayouts}
          totalSavings={stats.totalSavings}
          totalTradingPayouts={stats.totalTradingPayouts}
          expenseIncreasePercent={stats.expenseIncreasePercent}
          capitalProtectionRisk={stats.capitalProtectionRisk}
          drawdownPercent={stats.drawdownPercent}
        />
        <TraderFinancialHealthScore
          savingsRate={stats.savingsProgress}
          spendingDiscipline={stats.monthlyBudgetUsage <= 100 ? 100 - stats.monthlyBudgetUsage : 0}
          budgetConsistency={stats.monthlyBudgetUsage <= 100 ? 100 : 50}
          currentWealth={stats.netWorth}
          totalTradingProfits={stats.totalTradingPayouts}
          retentionRate={stats.retentionRate}
          emergencyFundStrength={stats.emergencyFundStrength}
          unnecessaryExpenses={stats.unnecessaryExpenses}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <PayoutImportSection onDataChange={fetchStats} />
        <EmergencyFundTracker onDataChange={fetchStats} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <NetWorthOverview onDataChange={fetchStats} />
        <RecurringExpenses onDataChange={fetchStats} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <WealthHeatmapCalendar />
        <WealthReportSection financialHealthScore={stats.financialHealthScore} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <SavingsGoals onDataChange={fetchStats} />
        <BudgetManager onDataChange={fetchStats} />
      </div>

      <SpendingAnalytics />
    </div>
  );
}