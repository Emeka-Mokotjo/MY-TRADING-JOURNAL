import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Calculate total payouts for a user across all accounts
 */
export async function calculateTotalPayouts(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  if (!userId) return 0;

  try {
    const { data, error } = await supabase
      .from("payouts")
      .select("amount")
      .eq("user_id", userId);

    if (error) {
      console.error("Error calculating total payouts:", error);
      return 0;
    }

    if (!data || data.length === 0) {
      return 0;
    }

    const total = data.reduce((sum, payout) => sum + Number(payout.amount), 0);
    return total;
  } catch (err) {
    console.error("Error in calculateTotalPayouts:", err);
    return 0;
  }
}

/**
 * Calculate payouts for current month
 */
export async function calculateMonthPayouts(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  if (!userId) return 0;

  try {
    // Get current month start and end dates
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const { data, error } = await supabase
      .from("payouts")
      .select("amount")
      .eq("user_id", userId)
      .gte("created_at", monthStart.toISOString())
      .lte("created_at", monthEnd.toISOString());

    if (error) {
      console.error("Error calculating month payouts:", error);
      return 0;
    }

    if (!data || data.length === 0) {
      return 0;
    }

    const total = data.reduce((sum, payout) => sum + Number(payout.amount), 0);
    return total;
  } catch (err) {
    console.error("Error in calculateMonthPayouts:", err);
    return 0;
  }
}

/**
 * Get count of all payouts for a user
 */
export async function getPayoutCount(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  if (!userId) return 0;

  try {
    const { data, error } = await supabase
      .from("payouts")
      .select("id", { count: "exact" })
      .eq("user_id", userId);

    if (error) {
      console.error("Error getting payout count:", error);
      return 0;
    }

    return data?.length || 0;
  } catch (err) {
    console.error("Error in getPayoutCount:", err);
    return 0;
  }
}

/**
 * Calculate total payouts for a specific account
 */
export async function calculateAccountPayouts(
  supabase: SupabaseClient,
  accountId: string
): Promise<number> {
  if (!accountId) return 0;

  try {
    const { data, error } = await supabase
      .from("payouts")
      .select("amount")
      .eq("account_id", accountId);

    if (error) {
      console.error("Error calculating account payouts:", error);
      return 0;
    }

    if (!data || data.length === 0) {
      return 0;
    }

    const total = data.reduce((sum, payout) => sum + Number(payout.amount), 0);
    return total;
  } catch (err) {
    console.error("Error in calculateAccountPayouts:", err);
    return 0;
  }
}

/**
 * Get net balance for an account
 * Formula: balance = starting_balance + total_pnl - total_payouts
 */
export async function getAccountNetBalance(
  supabase: SupabaseClient,
  accountId: string,
  userId: string
): Promise<{
  startingBalance: number;
  totalPnL: number;
  totalPayouts: number;
  netBalance: number;
}> {
  try {
    // Get account starting balance
    const { data: accountData } = await supabase
      .from("capital_accounts")
      .select("account_size, balance")
      .eq("id", accountId)
      .eq("user_id", userId)
      .single();

    // Get total trades PnL for this account
    const { data: tradesData } = await supabase
      .from("trades")
      .select("pnl")
      .eq("account_id", accountId)
      .eq("user_id", userId);

    // Get total payouts for this account
    const totalPayouts = await calculateAccountPayouts(supabase, accountId);

    const startingBalance = accountData
      ? Number(accountData.account_size) || Number(accountData.balance)
      : 0;

    const totalPnL = tradesData
      ? tradesData.reduce((sum, t) => sum + Number(t.pnl), 0)
      : 0;

    const netBalance = startingBalance + totalPnL - totalPayouts;

    return {
      startingBalance,
      totalPnL,
      totalPayouts,
      netBalance,
    };
  } catch (err) {
    console.error("Error in getAccountNetBalance:", err);
    return {
      startingBalance: 0,
      totalPnL: 0,
      totalPayouts: 0,
      netBalance: 0,
    };
  }
}

/**
 * Get all payouts for a user with account details
 */
export async function getUserPayouts(
  supabase: SupabaseClient,
  userId: string
): Promise<
  Array<{
    id: string;
    account_id: string;
    amount: number;
    note: string | null;
    created_at: string;
    account_name?: string;
  }>
> {
  if (!userId) return [];

  try {
    const { data, error } = await supabase
      .from("payouts")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error getting user payouts:", error);
      return [];
    }

    if (!data) {
      return [];
    }

    // Fetch account names separately
    const accountIds = Array.from(new Set(data.map((p) => p.account_id)));
    const { data: accountsData } = await supabase
      .from("capital_accounts")
      .select("id, account_name")
      .in("id", accountIds);

    const accountMap = (accountsData || []).reduce(
      (acc, curr) => {
        acc[curr.id] = curr.account_name;
        return acc;
      },
      {} as Record<string, string>
    );

    return data.map((payout) => ({
      ...payout,
      account_name: accountMap[payout.account_id] || "Unknown Account",
    }));
  } catch (err) {
    console.error("Error in getUserPayouts:", err);
    return [];
  }
}

/**
 * Validate if account has sufficient balance for payout
 */
export async function validatePayoutAmount(
  supabase: SupabaseClient,
  accountId: string,
  userId: string,
  amount: number
): Promise<{
  isValid: boolean;
  message: string;
  availableBalance: number;
}> {
  try {
    const { startingBalance, totalPnL, totalPayouts, netBalance } =
      await getAccountNetBalance(supabase, accountId, userId);

    const availableBalance = netBalance;

    if (amount <= 0) {
      return {
        isValid: false,
        message: "Amount must be greater than 0",
        availableBalance,
      };
    }

    if (amount > availableBalance) {
      return {
        isValid: false,
        message: `Insufficient balance. Available: $${availableBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
        availableBalance,
      };
    }

    return {
      isValid: true,
      message: "Valid",
      availableBalance,
    };
  } catch (err) {
    console.error("Error in validatePayoutAmount:", err);
    return {
      isValid: false,
      message: "Error validating payout amount",
      availableBalance: 0,
    };
  }
}
