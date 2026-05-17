// FINANCIAL ACTIVITY CALENDAR - INTEGRATION EXAMPLES
// This file shows how to integrate and use the new Money & Capital Calendar system

// ============================================================================
// 1. ACCESSING THE CALENDAR
// ============================================================================

// Navigate to the calendar from:
// - Money Management page: Click "Activity Calendar" button in header
// - Direct URL: /money-management/calendar
// - Sidebar: Will be in future navigation updates

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";

export function CalendarLink() {
  return (
    <Link href="/money-management/calendar">
      <Button className="gap-2">
        <Calendar className="w-4 h-4" />
        View Financial Calendar
      </Button>
    </Link>
  );
}

// ============================================================================
// 2. USING THE FINANCIAL CALENDAR UTILITIES IN CUSTOM COMPONENTS
// ============================================================================

import { getFinancialCalendarData, calculateFinancialSummary } from "@/utils/financial-calendar";
import { useAuth } from "@/components/auth-provider";
import { supabase } from "@/utils/supabase/client";

export async function CustomFinancialWidget() {
  const { user } = useAuth();
  
  if (!user?.id) return null;

  // Get calendar data for current month
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const days = await getFinancialCalendarData(supabase, user.id, startOfMonth, endOfMonth);
  const summary = calculateFinancialSummary(days);

  return (
    <div>
      <h3>This Month's Cashflow</h3>
      <p>Total: ${summary.totalCashflow.toLocaleString()}</p>
      <p>Income: ${summary.totalInflow.toLocaleString()}</p>
      <p>Expenses: ${summary.totalOutflow.toLocaleString()}</p>
    </div>
  );
}

// ============================================================================
// 3. USING THE REALTIME HOOK IN COMPONENTS
// ============================================================================

import { useFinancialCalendarRealtime } from "@/hooks/useFinancialCalendarRealtime";

export function RealtimeCalendarWidget() {
  const { user } = useAuth();
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const { days, loading, summary, refreshCalendar } = useFinancialCalendarRealtime({
    supabase,
    userId: user?.id,
    startDate: startOfMonth,
    endDate: endOfMonth
  });

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h3>Realtime Financial Summary</h3>
      <p>Cashflow: ${summary.totalCashflow.toLocaleString()}</p>
      <p>Best Day: {summary.bestDay?.date} (+${summary.bestDay?.amount.toLocaleString()})</p>
      <button onClick={refreshCalendar}>Refresh</button>
    </div>
  );
}

// ============================================================================
// 4. ADDING FINANCIAL DATA (Expense Example)
// ============================================================================

import toast from "react-hot-toast";

export async function logExpense(userId: string, expenseData: {
  title: string;
  category: string;
  amount: number;
  description?: string;
  expense_date: string;
}) {
  const { error } = await supabase
    .from('expenses')
    .insert([{
      user_id: userId,
      ...expenseData
    }]);

  if (error) {
    toast.error('Failed to log expense');
    return false;
  }

  toast.success('Expense logged! Calendar will update instantly.');
  // Calendar will automatically update via real-time subscription
  return true;
}

// ============================================================================
// 5. ADDING FINANCIAL DATA (External Income Example)
// ============================================================================

export async function logExternalIncome(userId: string, incomeData: {
  title: string;
  source_type: string;
  amount: number;
  description?: string;
  received_date: string;
}) {
  const { error } = await supabase
    .from('external_income')
    .insert([{
      user_id: userId,
      ...incomeData
    }]);

  if (error) {
    toast.error('Failed to log income');
    return false;
  }

  toast.success('Income logged! Calendar will update instantly.');
  // Calendar will automatically update via real-time subscription
  return true;
}

// ============================================================================
// 6. ADDING FINANCIAL DATA (Account Purchase Example)
// ============================================================================

export async function logAccountPurchase(userId: string, purchaseData: {
  provider: 'ftmo' | 'tradingfuel' | 'prop_firm' | 'other';
  account_size: number;
  leverage?: number;
  cost: number;
  purchase_reason?: string;
  account_id?: string;
}) {
  const { error } = await supabase
    .from('account_purchases')
    .insert([{
      user_id: userId,
      purchased_at: new Date().toISOString().split('T')[0],
      ...purchaseData
    }]);

  if (error) {
    toast.error('Failed to log account purchase');
    return false;
  }

  toast.success('Account purchase logged! Calendar updated.');
  // Calendar will automatically update via real-time subscription
  return true;
}

// ============================================================================
// 7. ADDING FINANCIAL DATA (Allocation Transfer Example)
// ============================================================================

export async function logAllocationTransfer(userId: string, transferData: {
  from_category: 'available' | 'savings' | 'emergency_fund' | 'investments' | 'trading' | 'lifestyle';
  to_category: 'available' | 'savings' | 'emergency_fund' | 'investments' | 'trading' | 'lifestyle';
  amount: number;
  notes?: string;
}) {
  const { error } = await supabase
    .from('allocation_transfers')
    .insert([{
      user_id: userId,
      transferred_at: new Date().toISOString().split('T')[0],
      ...transferData
    }]);

  if (error) {
    toast.error('Failed to log allocation transfer');
    return false;
  }

  toast.success('Allocation transfer logged! Calendar updated.');
  // Calendar will automatically update via real-time subscription
  return true;
}

// ============================================================================
// 8. QUERYING CALENDAR DATA WITH FILTERS
// ============================================================================

export async function getMonthlyIncome(userId: string, month: Date) {
  const start = new Date(month.getFullYear(), month.getMonth(), 1);
  const end = new Date(month.getFullYear(), month.getMonth() + 1, 0);

  const days = await getFinancialCalendarData(supabase, userId, start, end);
  const incomeActivities = days
    .flatMap(d => d.activities)
    .filter(a => a.type === 'income' || a.type === 'capital');

  return incomeActivities.reduce((sum, a) => sum + a.amount, 0);
}

export async function getMonthlyExpenses(userId: string, month: Date) {
  const start = new Date(month.getFullYear(), month.getMonth(), 1);
  const end = new Date(month.getFullYear(), month.getMonth() + 1, 0);

  const days = await getFinancialCalendarData(supabase, userId, start, end);
  const expenseActivities = days
    .flatMap(d => d.activities)
    .filter(a => a.type === 'expense' || a.type === 'trading');

  return expenseActivities.reduce((sum, a) => sum + a.amount, 0);
}

// ============================================================================
// 9. USING PRIVACY MODE WITH CALENDAR
// ============================================================================

import { usePrivacy } from "@/contexts/PrivacyContext";

export function PrivateFinancialDisplay() {
  const { privacyMode } = usePrivacy();

  function formatAmount(amount: number) {
    if (privacyMode) return '*****';
    return `$${amount.toLocaleString()}`;
  }

  return (
    <div>
      <p>Monthly Income: {formatAmount(50000)}</p>
      <p>Monthly Expenses: {formatAmount(12000)}</p>
    </div>
  );
}

// ============================================================================
// 10. CALENDAR DAY DATA STRUCTURE (For Reference)
// ============================================================================

interface DayFinancialsExample {
  date: "2026-05-12",
  inflow: 25000,           // Total income + capital for day
  outflow: 5000,           // Total expenses + investments
  netFlow: 20000,          // inflow - outflow (positive = good day)
  activityCount: 5,        // Number of transactions
  status: "positive",      // or "negative" or "neutral"
  activities: [
    {
      id: "uuid-1",
      date: "2026-05-12",
      type: "income",      // or "expense", "investment", "trading", "capital", "transfer"
      category: "Trading Payout",
      amount: 15000,
      description: "FTMO Payout",
      subType: "payout"
    },
    {
      id: "uuid-2",
      date: "2026-05-12",
      type: "expense",
      category: "Lifestyle",
      amount: 5000,
      description: "Living expenses",
      subType: "spending"
    }
  ]
}

// ============================================================================
// 11. MONITORING CALENDAR CHANGES
// ============================================================================

export function useCalendarMonitoring(userId: string) {
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  
  useEffect(() => {
    if (!userId) return;

    const channels = [
      supabase.channel('monitor-expenses')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'expenses', filter: `user_id=eq.${userId}` },
          () => {
            setLastUpdate(new Date());
            console.log('Expenses updated');
          }
        )
        .subscribe(),
      
      supabase.channel('monitor-income')
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'external_income', filter: `user_id=eq.${userId}` },
          () => {
            setLastUpdate(new Date());
            console.log('Income updated');
          }
        )
        .subscribe()
    ];

    return () => {
      channels.forEach(c => supabase.removeChannel(c));
    };
  }, [userId]);

  return lastUpdate;
}

// ============================================================================
// SUMMARY: HOW TO USE THE FINANCIAL CALENDAR
// ============================================================================

/*
QUICK START:
1. Navigate to /money-management/calendar
2. View the monthly calendar with color-coded days
3. Click any day to see all transactions for that day
4. Use filters to view specific activity types
5. Check summary tiles for overall statistics
6. All data updates in real-time as you log transactions

ADDING TRANSACTIONS:
- Expenses via Money Management or dedicated expense form
- External income via Money Management income section
- Account purchases via Capital management
- Allocations via Money Management allocation controls

DATA SOURCES:
- expenses table
- external_income table
- payouts table (from trading)
- capital_accounts table (capital additions)
- withdrawals table (account withdrawals)
- account_purchases table (funded account purchases)
- allocation_transfers table (allocation movements)

KEY FEATURES:
✓ Automatic real-time updates
✓ Color-coded positive/negative/neutral days
✓ Detailed day-by-day breakdown
✓ Summary statistics tiles
✓ Activity filtering by type
✓ Date range filtering (monthly/quarterly/yearly)
✓ Privacy mode integration
✓ Mobile responsive design

PRIVACY:
- Toggle privacy mode in sidebar profile menu
- All currency amounts mask as "*****"
- Perfect for screenshots/recordings
- Persists across sessions
*/
