import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Calculate total capital for a user from all capital accounts
 * Returns 0 if user has no accounts or they are all empty
 */
export async function calculateTotalCapital(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  if (!userId) return 0;

  try {
    const { data, error } = await supabase
      .from("capital_accounts")
      .select("balance")
      .eq("user_id", userId);

    if (error) {
      console.error("Error calculating total capital:", error);
      return 0;
    }

    if (!data || data.length === 0) {
      return 0;
    }

    const total = data.reduce((sum, account) => sum + Number(account.balance), 0);
    return total;
  } catch (err) {
    console.error("Error in calculateTotalCapital:", err);
    return 0;
  }
}

/**
 * Calculate maximum risk amount based on total capital and risk percentage
 * Used for trade risk management
 */
export function calculateMaxRisk(totalCapital: number, riskPercentage: number): number {
  if (totalCapital <= 0 || riskPercentage <= 0) return 0;
  return (totalCapital * riskPercentage) / 100;
}

/**
 * Check if user has capital to trade
 */
export async function hasCapital(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  const totalCapital = await calculateTotalCapital(supabase, userId);
  return totalCapital > 0;
}

/**
 * Get breakdown of capital by type
 */
export async function getCapitalBreakdown(
  supabase: SupabaseClient,
  userId: string
): Promise<{
  totalCapital: number;
  personalCapital: number;
  fundedCapital: number;
  accountCount: number;
}> {
  if (!userId) {
    return {
      totalCapital: 0,
      personalCapital: 0,
      fundedCapital: 0,
      accountCount: 0,
    };
  }

  try {
    const { data, error } = await supabase
      .from("capital_accounts")
      .select("balance, account_type")
      .eq("user_id", userId);

    if (error || !data) {
      console.error("Error getting capital breakdown:", error);
      return {
        totalCapital: 0,
        personalCapital: 0,
        fundedCapital: 0,
        accountCount: 0,
      };
    }

    const personalCapital = data
      .filter((acc) => acc.account_type === "personal")
      .reduce((sum, acc) => sum + Number(acc.balance), 0);

    const fundedCapital = data
      .filter((acc) => acc.account_type === "funded")
      .reduce((sum, acc) => sum + Number(acc.balance), 0);

    const totalCapital = personalCapital + fundedCapital;

    return {
      totalCapital,
      personalCapital,
      fundedCapital,
      accountCount: data.length,
    };
  } catch (err) {
    console.error("Error in getCapitalBreakdown:", err);
    return {
      totalCapital: 0,
      personalCapital: 0,
      fundedCapital: 0,
      accountCount: 0,
    };
  }
}
