# Financial Activity Calendar System

## Overview

The Financial Activity Calendar is a comprehensive financial tracking system that monitors all money movement across the BemoEdge platform. It provides traders with a visual representation of their financial behavior, enabling better wealth management and disciplined financial growth.

## Features

### 1. **Visual Calendar Grid**
- Monthly calendar view with color-coded days
- Blue glow for positive cashflow days
- Red glow for negative cashflow days
- Neutral gray for balanced days
- Intensity based on magnitude of net flow

### 2. **Real-Time Data Aggregation**
Automatically tracks all financial activities:
- **Capital Additions** - New capital added to accounts
- **Trading Payouts** - Income from funded accounts
- **External Income** - Salary, freelance, business income
- **Expenses** - Personal spending across all categories
- **Withdrawals** - Capital withdrawals from accounts
- **Account Purchases** - Funded account purchases (FTMO, etc)
- **Allocation Transfers** - Savings, emergency fund, investments

### 3. **Summary Tiles**
- **Total Cashflow** - Overall net flow for period
- **Total Income** - Sum of all inflows
- **Total Expenses** - Sum of all outflows
- **Best Cashflow Day** - Day with highest positive flow
- **Worst Cashflow Day** - Day with highest negative flow
- **Positive/Negative/Neutral Days** - Count of each type
- **Average Daily Flow** - Mean daily cashflow

### 4. **Day Detail Modal**
Click any day to see:
- Breakdown of all transactions for that day
- Activity type indicators (income, expense, investment, trading)
- Category badges
- Detailed descriptions
- Amount for each transaction

### 5. **Smart Filtering**
- **Activity Filters**: All, Income, Expenses, Investments, Trading
- **Date Filters**: Monthly, Quarterly, Yearly
- Real-time filter application

### 6. **Privacy Mode Integration**
- All sensitive amounts masked when privacy mode enabled
- Masks show as "*****" 
- Protects against screenshots/recordings

## Technical Architecture

### Database Tables

#### `withdrawals`
```sql
- id UUID
- user_id UUID (FK profiles)
- account_id UUID (FK capital_accounts)
- amount NUMERIC
- withdrawal_reason TEXT
- destination TEXT
- withdrawn_at DATE
- created_at TIMESTAMPTZ
```

#### `account_purchases`
```sql
- id UUID
- user_id UUID (FK profiles)
- account_id UUID (FK capital_accounts)
- provider TEXT (ftmo, tradingfuel, prop_firm, other)
- account_size NUMERIC
- leverage NUMERIC
- cost NUMERIC
- purchase_reason TEXT
- status TEXT (active, completed, failed, cancelled)
- purchased_at DATE
- created_at TIMESTAMPTZ
```

#### `allocation_transfers`
```sql
- id UUID
- user_id UUID (FK profiles)
- from_category TEXT
- to_category TEXT
- amount NUMERIC
- transferred_at DATE
- created_at TIMESTAMPTZ
```

All tables have Row-Level Security policies restricting to user's own data.

### Core Components

#### `MoneyCalendar.tsx`
Main calendar grid component showing all days with:
- Color-coded backgrounds based on status
- Net cashflow amount
- Activity count
- Click handler for day details
- Month navigation

#### `DayDetailModal.tsx`
Modal that displays all activities for selected day:
- Grouped by income, expenses, investments
- Color-coded category badges
- Formatted amounts
- Privacy mode masking

#### `FinancialSummaryTiles.tsx`
8 summary cards showing:
- Total metrics
- Best/worst days
- Count of positive/negative/neutral days
- Average daily flow

#### `FinancialFilters.tsx`
Filter controls:
- Activity type selector
- Date range selector
- Active filter display
- Clear individual filters

### Utility Functions

#### `financial-calendar.ts`

**`getFinancialCalendarData()`**
Aggregates all financial data by date:
- Fetches from all financial tables in parallel
- Groups transactions by date
- Calculates inflow/outflow/netFlow for each day
- Determines day status (positive/negative/neutral)
- Returns sorted array of DayFinancials

**`calculateFinancialSummary()`**
Computes summary statistics:
- Total inflow/outflow/cashflow
- Best/worst day
- Average daily flow
- Count of day types
- Returns FinancialSummary object

### Real-Time Updates

Uses Supabase real-time subscriptions:
- Subscribes to 7 financial tables
- Triggers refresh when any table changes
- Debounced refresh (100ms) to prevent excessive updates
- Automatic sync with database

## Usage

### Navigate to Calendar
From Money Management page, click "Activity Calendar" button.

### View Daily Activity
Click any day on the calendar to see detailed breakdown:
1. Total inflow/outflow/net for day
2. All transactions grouped by category
3. Amount and description for each

### Filter Activities
1. Select activity type (Income, Expenses, etc)
2. Select date range (Monthly, Quarterly, Yearly)
3. View filtered results

### Apply Privacy Mode
Toggle privacy mode in sidebar profile menu:
- All currency amounts become "*****"
- Protects sensitive data in screenshots

## Integration Points

### Sidebar Navigation
Add link in sidebar navigation to `/money-management/calendar`

### Money Management Page
Already has "Activity Calendar" button in header

### Capital Tracking
Calendar automatically includes:
- New capital account additions
- Account withdrawals
- Account purchase costs

### External Income
Calendar tracks:
- External income entries
- Salary, freelance, business income
- Custom income sources

### Expenses
Calendar includes:
- All expense entries
- Categorized spending
- Withdrawal amounts

## Example Data Flow

1. **User adds external income**
   - Entry saved to `external_income` table
   - Real-time subscription triggered
   - Calendar data refreshed
   - Calendar updates with new inflow

2. **User logs expense**
   - Entry saved to `expenses` table
   - Real-time subscription triggered
   - Calendar data refreshed
   - Calendar updates with new outflow

3. **User buys funded account**
   - Entry saved to `account_purchases` table
   - Real-time subscription triggered
   - Calendar data refreshed
   - Calendar updates trading expense

## Performance Considerations

### Data Fetching
- Parallel queries for all financial tables
- Single month fetched at a time
- Filtered in memory for activity types

### Real-Time
- Debounced refresh to prevent excessive updates
- Subscriptions only active during component lifetime
- Channels properly cleaned up on unmount

### Rendering
- Calendar grid uses optimized CSS grid
- Day cells memoized for re-renders
- Modal only renders when selected

## Privacy & Security

### Row-Level Security
All tables have RLS policies:
- Users can only view own data
- Users can only insert/update own data
- Users can only delete own data

### Privacy Mode
- Integrates with global PrivacyContext
- Masks all currency values when enabled
- localStorage persists privacy mode setting

## Future Enhancements

### Heatmap Mode
- Color intensity based on cashflow magnitude
- Hover for exact amounts
- Period comparison

### Financial Streaks
- Consecutive positive days counter
- Best streak badge
- Streak milestone alerts

### Spending Trends
- Trend line overlay on calendar
- Category breakdown by day
- Top expense highlights

### Wealth Growth Overlay
- Net worth progression
- Daily wealth change
- Growth trajectory

### Detailed Analytics
- Category spending breakdown
- Source breakdown for income
- Year-over-year comparison

## API Reference

### `DayFinancials` Interface
```typescript
{
  date: string;           // "2026-05-12"
  inflow: number;         // Total positive money
  outflow: number;        // Total negative money
  netFlow: number;        // inflow - outflow
  activityCount: number;  // Number of transactions
  status: 'positive' | 'negative' | 'neutral';
  activities: FinancialActivity[];
}
```

### `FinancialActivity` Interface
```typescript
{
  id: string;
  date: string;
  type: 'income' | 'expense' | 'investment' | 'trading' | 'capital' | 'transfer';
  category: string;
  amount: number;
  description: string;
  subType?: string;
}
```

### `FinancialSummary` Interface
```typescript
{
  totalInflow: number;
  totalOutflow: number;
  totalCashflow: number;
  bestDay: { date: string; amount: number } | null;
  worstDay: { date: string; amount: number } | null;
  averageDailyFlow: number;
  positiveDays: number;
  negativeDays: number;
  neutralDays: number;
}
```

## Troubleshooting

### Calendar Not Updating
1. Check Supabase real-time enabled
2. Verify row-level security policies
3. Check browser console for errors
4. Manually refresh page

### Missing Data
1. Verify tables exist in Supabase
2. Check user_id is correct
3. Verify row-level security policies
4. Check date range filters

### Performance Issues
1. Reduce date range fetched
2. Check number of transactions
3. Monitor network tab
4. Check Supabase logs

## Files Created

- `/supabase/financial_calendar_schema.sql` - Database tables
- `/utils/financial-calendar.ts` - Core logic & types
- `/components/MoneyCalendar.tsx` - Calendar grid
- `/components/DayDetailModal.tsx` - Day detail modal
- `/components/FinancialSummaryTiles.tsx` - Summary cards
- `/components/FinancialFilters.tsx` - Filter controls
- `/hooks/useFinancialCalendarRealtime.ts` - Real-time hook
- `/app/(dashboard)/money-management/calendar/page.tsx` - Calendar page

## Files Modified

- `/app/(dashboard)/money-management/page.tsx` - Added calendar link
