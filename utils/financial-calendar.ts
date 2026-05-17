import { SupabaseClient } from "@supabase/supabase-js";

export interface FinancialActivity {
  id: string;
  date: string;
  type: 'income' | 'expense' | 'investment' | 'trading' | 'transfer' | 'capital';
  category: string;
  amount: number;
  description: string;
  subType?: string;
}

export interface DayFinancials {
  date: string;
  inflow: number;
  outflow: number;
  netFlow: number;
  activityCount: number;
  status: 'positive' | 'negative' | 'neutral';
  activities: FinancialActivity[];
}

/**
 * Aggregate all financial activities for a user across all sources
 * Returns data grouped by date with inflow, outflow, and net calculations
 */
export async function getFinancialCalendarData(
  supabase: SupabaseClient,
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<DayFinancials[]> {
  try {
    const start = startDate.toISOString().split('T')[0];
    const end = endDate.toISOString().split('T')[0];

    const dailyMap = new Map<string, { inflow: number; outflow: number; activities: FinancialActivity[] }>();
    const ensureDate = (dateStr: string) => {
      if (!dailyMap.has(dateStr)) {
        dailyMap.set(dateStr, { inflow: 0, outflow: 0, activities: [] });
      }
      return dailyMap.get(dateStr)!;
    };

    // Try to build calendar from centralized financial transactions first.
    const { data: transactionData, error: transactionError } = await supabase
      .from("financial_transactions")
      .select("*")
      .eq("user_id", userId)
      .gte("transaction_date", start)
      .lte("transaction_date", end)
      .order("transaction_date", { ascending: true })
      .order("created_at", { ascending: true });

    if (!transactionError && transactionData && transactionData.length > 0) {
      transactionData.forEach((item: any) => {
        const date = item.transaction_date;
        const day = ensureDate(date);
        const amount = Number(item.amount);
        const activityType = item.type === "Income" ? "income" : item.type === "Expense" ? "expense" : "transfer";

        if (activityType === "income") {
          day.inflow += amount;
        }
        if (activityType === "expense") {
          day.outflow += amount;
        }

        day.activities.push({
          id: item.id,
          date,
          type: activityType,
          category: item.category,
          amount,
          description: item.title,
          subType: item.source_table || "financial_transactions",
        });
      });
    } else {
      if (transactionError && !transactionError.message?.toLowerCase().includes("does not exist")) {
        console.error("Error loading financial transactions for calendar:", transactionError);
      }

      const [
        { data: payouts },
        { data: externalIncome },
        { data: expenses },
        { data: withdrawals },
        { data: accountPurchases },
        { data: allocationTransfers },
        { data: capitalAccounts }
      ] = await Promise.all([
        supabase
          .from('payouts')
          .select('id, amount, created_at, note')
          .eq('user_id', userId)
          .gte('created_at', `${start}T00:00:00`)
          .lte('created_at', `${end}T23:59:59`),

        supabase
          .from('external_income')
          .select('id, amount, received_date, source_type, title')
          .eq('user_id', userId)
          .gte('received_date', start)
          .lte('received_date', end),

        supabase
          .from('expenses')
          .select('id, amount, expense_date, category, title')
          .eq('user_id', userId)
          .gte('expense_date', start)
          .lte('expense_date', end),

        supabase
          .from('withdrawals')
          .select('id, amount, withdrawn_at, withdrawal_reason')
          .eq('user_id', userId)
          .gte('withdrawn_at', start)
          .lte('withdrawn_at', end),

        supabase
          .from('account_purchases')
          .select('id, cost, purchased_at, provider, account_size')
          .eq('user_id', userId)
          .gte('purchased_at', start)
          .lte('purchased_at', end),

        supabase
          .from('allocation_transfers')
          .select('id, amount, transferred_at, from_category, to_category')
          .eq('user_id', userId)
          .gte('transferred_at', start)
          .lte('transferred_at', end),

        supabase
          .from('capital_accounts')
          .select('id, created_at, balance')
          .eq('user_id', userId)
          .gte('created_at', `${start}T00:00:00`)
          .lte('created_at', `${end}T23:59:59`)
      ]);

      if (payouts) {
        payouts.forEach((payout: any) => {
          const date = new Date(payout.created_at).toISOString().split('T')[0];
          const day = ensureDate(date);
          const amount = Number(payout.amount);
          day.inflow += amount;
          day.activities.push({
            id: payout.id,
            date,
            type: 'income',
            category: 'Trading Payout',
            amount,
            description: payout.note || 'Trading Payout',
            subType: 'payout'
          });
        });
      }

      if (externalIncome) {
        externalIncome.forEach((income: any) => {
          const date = income.received_date;
          const day = ensureDate(date);
          const amount = Number(income.amount);
          day.inflow += amount;
          day.activities.push({
            id: income.id,
            date,
            type: 'income',
            category: `${income.source_type.charAt(0).toUpperCase() + income.source_type.slice(1)} Income`,
            amount,
            description: income.title,
            subType: income.source_type
          });
        });
      }

      if (capitalAccounts) {
        capitalAccounts.forEach((account: any) => {
          const date = new Date(account.created_at).toISOString().split('T')[0];
          const day = ensureDate(date);
          const amount = Number(account.balance);
          if (amount > 0) {
            day.inflow += amount;
            day.activities.push({
              id: account.id,
              date,
              type: 'capital',
              category: 'Capital Added',
              amount,
              description: 'Capital Addition',
              subType: 'capital'
            });
          }
        });
      }

      if (expenses) {
        expenses.forEach((expense: any) => {
          const date = expense.expense_date;
          const day = ensureDate(date);
          const amount = Number(expense.amount);
          day.outflow += amount;
          day.activities.push({
            id: expense.id,
            date,
            type: 'expense',
            category: expense.category.charAt(0).toUpperCase() + expense.category.slice(1),
            amount,
            description: expense.title,
            subType: 'spending'
          });
        });
      }

      if (withdrawals) {
        withdrawals.forEach((withdrawal: any) => {
          const date = withdrawal.withdrawn_at;
          const day = ensureDate(date);
          const amount = Number(withdrawal.amount);
          day.outflow += amount;
          day.activities.push({
            id: withdrawal.id,
            date,
            type: 'expense',
            category: 'Withdrawal',
            amount,
            description: withdrawal.withdrawal_reason || 'Account Withdrawal',
            subType: 'withdrawal'
          });
        });
      }

      if (accountPurchases) {
        accountPurchases.forEach((purchase: any) => {
          const date = purchase.purchased_at;
          const day = ensureDate(date);
          const amount = Number(purchase.cost);
          day.outflow += amount;
          day.activities.push({
            id: purchase.id,
            date,
            type: 'trading',
            category: 'Funded Account',
            amount,
            description: `${purchase.provider.toUpperCase()} - $${purchase.account_size}`,
            subType: 'account_purchase'
          });
        });
      }

      if (allocationTransfers) {
        allocationTransfers.forEach((transfer: any) => {
          const date = transfer.transferred_at;
          const day = ensureDate(date);
          const amount = Number(transfer.amount);

          if (['savings', 'emergency_fund', 'investments'].includes(transfer.to_category)) {
            day.outflow += amount;
          }

          day.activities.push({
            id: transfer.id,
            date,
            type: 'investment',
            category: `Allocation to ${transfer.to_category.replace('_', ' ').toUpperCase()}`,
            amount,
            description: `Transfer: ${transfer.to_category.replace('_', ' ')}`,
            subType: 'allocation'
          });
        });
      }
    }

    const result: DayFinancials[] = Array.from(dailyMap.entries())
      .map(([date, data]) => {
        const status = data.inflow - data.outflow > 0
          ? 'positive'
          : data.inflow - data.outflow < 0
          ? 'negative'
          : 'neutral';

        return {
          date,
          inflow: parseFloat(data.inflow.toFixed(2)),
          outflow: parseFloat(data.outflow.toFixed(2)),
          netFlow: parseFloat((data.inflow - data.outflow).toFixed(2)),
          activityCount: data.activities.length,
          status: status as 'positive' | 'negative' | 'neutral',
          activities: data.activities.sort((a, b) => {
            const typeOrder = { income: 0, capital: 1, investment: 2, expense: 3, trading: 4, transfer: 5 };
            const aOrder = typeOrder[a.type as keyof typeof typeOrder] || 6;
            const bOrder = typeOrder[b.type as keyof typeof typeOrder] || 6;
            return aOrder - bOrder || b.amount - a.amount;
          })
        };
      });

    return result;
  } catch (error) {
    console.error('Error fetching financial calendar data:', error);
    return [];
  }
}

/**
 * Calculate summary statistics for the financial period
 */
export function calculateFinancialSummary(days: DayFinancials[]) {
  const totalInflow = days.reduce((sum, day) => sum + day.inflow, 0);
  const totalOutflow = days.reduce((sum, day) => sum + day.outflow, 0);
  const totalCashflow = totalInflow - totalOutflow;

  const positiveDay = days.find(d => d.status === 'positive') || null;
  const bestDay = days.reduce((best, day) => day.netFlow > (best?.netFlow || 0) ? day : best, positiveDay);
  const worstDay = days.reduce((worst: DayFinancials | null, day) => day.netFlow < (worst?.netFlow || 0) ? day : worst, null);

  return {
    totalInflow: parseFloat(totalInflow.toFixed(2)),
    totalOutflow: parseFloat(totalOutflow.toFixed(2)),
    totalCashflow: parseFloat(totalCashflow.toFixed(2)),
    bestDay: bestDay ? { date: bestDay.date, amount: bestDay.netFlow } : null,
    worstDay: worstDay ? { date: worstDay.date, amount: worstDay.netFlow } : null,
    averageDailyFlow: parseFloat((totalCashflow / days.length).toFixed(2)),
    positiveDays: days.filter(d => d.status === 'positive').length,
    negativeDays: days.filter(d => d.status === 'negative').length,
    neutralDays: days.filter(d => d.status === 'neutral').length
  };
}
