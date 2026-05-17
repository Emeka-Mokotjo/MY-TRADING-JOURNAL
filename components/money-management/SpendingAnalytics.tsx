"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/utils/supabase/client";
import { useAuth } from "@/components/auth-provider";
import { formatZAR } from "@/utils/currency";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface SpendingAnalyticsProps {}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export function SpendingAnalytics({}: SpendingAnalyticsProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [expenseData, setExpenseData] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState({
    biggestExpenseCategory: "",
    totalUnnecessarySpending: 0,
    monthlySpendingBreakdown: [] as any[],
    averageMonthlySpending: 0,
    highestSpendingMonth: "",
    bestSavingsMonth: "",
    totalRetainedPayoutCapital: 0,
  });

  const fetchAnalytics = async () => {
    if (!user) return;

    try {
      // Fetch all expenses
      const { data: expenses, error: expensesError } = await supabase
        .from("expense_entries")
        .select("*")
        .eq("user_id", user.id)
        .order("spent_at", { ascending: false });

      if (expensesError) throw expensesError;

      // Fetch all income
      const { data: income, error: incomeError } = await supabase
        .from("income_entries")
        .select("*")
        .eq("user_id", user.id);

      if (incomeError) throw incomeError;

      // Fetch trading payouts
      const { data: payouts, error: payoutsError } = await supabase
        .from("payouts")
        .select("amount")
        .eq("user_id", user.id);

      if (payoutsError) throw payoutsError;

      // Process expense categories
      const categoryTotals: Record<string, number> = {};
      const monthlyTotals: Record<string, number> = {};
      let totalUnnecessary = 0;

      expenses?.forEach((expense) => {
        // Category totals
        categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + expense.amount;

        // Monthly totals
        const month = new Date(expense.spent_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
        monthlyTotals[month] = (monthlyTotals[month] || 0) + expense.amount;

        // Unnecessary spending
        if (expense.necessity_level === 'non_essential') {
          totalUnnecessary += expense.amount;
        }
      });

      // Prepare pie chart data
      const pieData = Object.entries(categoryTotals).map(([category, amount]) => ({
        name: category,
        value: amount,
      }));

      // Prepare monthly bar chart data
      const barData = Object.entries(monthlyTotals).map(([month, amount]) => ({
        month,
        amount,
      })).sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());

      // Calculate analytics
      const biggestCategory = Object.entries(categoryTotals).reduce((max, [cat, amt]) =>
        amt > (categoryTotals[max] || 0) ? cat : max, ""
      );

      const totalIncome = income?.reduce((sum, inc) => sum + inc.amount, 0) || 0;
      const totalExpenses = expenses?.reduce((sum, exp) => sum + exp.amount, 0) || 0;
      const totalPayouts = payouts?.reduce((sum, payout) => sum + payout.amount, 0) || 0;

      const monthlySpending = barData.length > 0 ? barData.reduce((sum, item) => sum + item.amount, 0) / barData.length : 0;
      const highestMonth = barData.reduce((max, item) => item.amount > max.amount ? item : max, { month: "", amount: 0 });
      const bestMonth = barData.reduce((min, item) => item.amount < min.amount ? item : min, { month: "", amount: Infinity });

      setExpenseData(pieData);
      setMonthlyData(barData);
      setAnalytics({
        biggestExpenseCategory: biggestCategory,
        totalUnnecessarySpending: totalUnnecessary,
        monthlySpendingBreakdown: barData,
        averageMonthlySpending: monthlySpending,
        highestSpendingMonth: highestMonth.month,
        bestSavingsMonth: bestMonth.amount !== Infinity ? bestMonth.month : "",
        totalRetainedPayoutCapital: totalIncome - totalExpenses,
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [user]);

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
        <CardTitle>Spending Analytics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Key Insights */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-card/50 rounded-lg">
            <div className="text-2xl font-bold text-foreground">{analytics.biggestExpenseCategory || "N/A"}</div>
            <div className="text-sm text-gray-400">Biggest Expense Category</div>
          </div>
          <div className="text-center p-4 bg-card/50 rounded-lg">
            <div className="text-2xl font-bold text-orange-400">{formatZAR(analytics.totalUnnecessarySpending)}</div>
            <div className="text-sm text-gray-400">Unnecessary Spending</div>
          </div>
          <div className="text-center p-4 bg-card/50 rounded-lg">
            <div className="text-2xl font-bold text-blue-400">{formatZAR(analytics.averageMonthlySpending)}</div>
            <div className="text-sm text-gray-400">Avg Monthly Spending</div>
          </div>
          <div className="text-center p-4 bg-card/50 rounded-lg">
            <div className="text-2xl font-bold text-green-400">{formatZAR(analytics.totalRetainedPayoutCapital)}</div>
            <div className="text-sm text-gray-400">Retained Capital</div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Expense Categories Pie Chart */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-foreground">Expense Categories</h3>
            {expenseData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={expenseData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {expenseData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatZAR(value)} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-400">
                No expense data available
              </div>
            )}
          </div>

          {/* Monthly Spending Bar Chart */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-foreground">Monthly Spending Trend</h3>
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="month" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" tickFormatter={(value) => `R${(value / 1000).toFixed(0)}k`} />
                  <Tooltip
                    formatter={(value: number) => [formatZAR(value), "Amount"]}
                    labelStyle={{ color: "#F9FAFB" }}
                    contentStyle={{ backgroundColor: "#1F2937", border: "1px solid #374151" }}
                  />
                  <Bar dataKey="amount" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-400">
                No monthly data available
              </div>
            )}
          </div>
        </div>

        {/* Additional Insights */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-card/50 rounded-lg">
            <h4 className="font-medium text-foreground mb-2">Spending Insights</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Highest spending month:</span>
                <span className="text-foreground">{analytics.highestSpendingMonth || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Best savings month:</span>
                <span className="text-foreground">{analytics.bestSavingsMonth || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Expense-to-income ratio:</span>
                <span className="text-foreground">
                  {analytics.monthlySpendingBreakdown.length > 0 && analytics.averageMonthlySpending > 0
                    ? `${((analytics.averageMonthlySpending / (analytics.totalRetainedPayoutCapital + analytics.averageMonthlySpending)) * 100).toFixed(1)}%`
                    : "N/A"
                  }
                </span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-card/50 rounded-lg">
            <h4 className="font-medium text-foreground mb-2">Wealth Building</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Monthly savings rate:</span>
                <span className="text-green-400">
                  {analytics.monthlySpendingBreakdown.length > 0
                    ? `${(((analytics.totalRetainedPayoutCapital / (analytics.totalRetainedPayoutCapital + analytics.averageMonthlySpending)) || 0) * 100).toFixed(1)}%`
                    : "N/A"
                  }
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Capital preservation:</span>
                <span className="text-blue-400">
                  {analytics.totalRetainedPayoutCapital >= 0 ? "Positive" : "Negative"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Discipline score:</span>
                <span className="text-foreground">
                  {analytics.totalUnnecessarySpending > analytics.averageMonthlySpending * 0.3 ? "Needs improvement" : "Good"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}