import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Generate a unique certificate ID
 * Format: BEMO-YYYY-XXXXXX (e.g., BEMO-2026-000123)
 */
export function generateCertificateId(): string {
  const year = new Date().getFullYear();
  const randomNum = Math.floor(Math.random() * 1000000)
    .toString()
    .padStart(6, "0");
  return `BEMO-${year}-${randomNum}`;
}

/**
 * Check if user qualifies for funded account certificate
 */
export async function checkFundedAccountCertificate(
  supabase: SupabaseClient,
  userId: string
): Promise<{
  qualifies: boolean;
  accounts: Array<{ id: string; name: string; size: number; type: string }>;
}> {
  try {
    const { data } = await supabase
      .from("capital_accounts")
      .select("id, account_name, balance, account_type")
      .eq("user_id", userId)
      .eq("account_type", "funded");

    const fundedAccounts =
      data?.map((acc) => ({
        id: acc.id,
        name: acc.account_name,
        size: Number(acc.balance),
        type: acc.account_type,
      })) || [];

    return {
      qualifies: fundedAccounts.length > 0,
      accounts: fundedAccounts,
    };
  } catch (err) {
    console.error("Error checking funded account certificate:", err);
    return { qualifies: false, accounts: [] };
  }
}

/**
 * Check if user qualifies for profit milestone certificates
 * Thresholds: $5,000, $10,000, $25,000
 */
export async function checkProfitMilestoneCertificates(
  supabase: SupabaseClient,
  userId: string
): Promise<
  Array<{
    threshold: number;
    qualifies: boolean;
    currentPnL: number;
    certificateType: string;
  }>
> {
  try {
    const { data: trades } = await supabase
      .from("trades")
      .select("pnl")
      .eq("user_id", userId);

    const totalPnL = trades?.reduce((sum, t) => sum + Number(t.pnl), 0) || 0;

    const thresholds = [5000, 10000, 25000];

    return thresholds.map((threshold) => ({
      threshold,
      qualifies: totalPnL >= threshold,
      currentPnL: totalPnL,
      certificateType: `profit_milestone_${threshold}`,
    }));
  } catch (err) {
    console.error("Error checking profit milestone certificates:", err);
    return [];
  }
}

/**
 * Check if user qualifies for consistency certificate
 * Requirement: X profitable days (e.g., 10+ days with positive PnL)
 */
export async function checkConsistencyCertificate(
  supabase: SupabaseClient,
  userId: string,
  requiredDays: number = 10
): Promise<{
  qualifies: boolean;
  profitableDays: number;
  requiredDays: number;
  totalDaysTraded: number;
}> {
  try {
    const { data: trades } = await supabase
      .from("trades")
      .select("created_at, pnl")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (!trades || trades.length === 0) {
      return {
        qualifies: false,
        profitableDays: 0,
        requiredDays,
        totalDaysTraded: 0,
      };
    }

    // Group trades by day and calculate daily PnL
    const dailyPnL: Record<string, number> = {};
    trades.forEach((trade) => {
      const date = new Date(trade.created_at).toLocaleDateString();
      dailyPnL[date] = (dailyPnL[date] || 0) + Number(trade.pnl);
    });

    // Count profitable days (PnL > 0)
    const profitableDays = Object.values(dailyPnL).filter(
      (pnl) => pnl > 0
    ).length;
    const totalDaysTraded = Object.keys(dailyPnL).length;

    return {
      qualifies: profitableDays >= requiredDays,
      profitableDays,
      requiredDays,
      totalDaysTraded,
    };
  } catch (err) {
    console.error("Error checking consistency certificate:", err);
    return {
      qualifies: false,
      profitableDays: 0,
      requiredDays,
      totalDaysTraded: 0,
    };
  }
}

/**
 * Check if certificate already exists (to prevent duplicates)
 */
export async function certificateExists(
  supabase: SupabaseClient,
  userId: string,
  certificateType: string,
  accountId?: string
): Promise<boolean> {
  try {
    const query = supabase
      .from("certificates")
      .select("id")
      .eq("user_id", userId)
      .eq("certificate_type", certificateType);

    if (accountId) {
      query.eq("account_id", accountId);
    }

    const { data, count } = await query;
    return (count || 0) > 0;
  } catch (err) {
    console.error("Error checking certificate existence:", err);
    return false;
  }
}

/**
 * Create a certificate in the database
 */
export async function createCertificate(
  supabase: SupabaseClient,
  userId: string,
  certificateType: string,
  title: string,
  description: string,
  accountId?: string
): Promise<{
  success: boolean;
  certificateId?: string;
  error?: string;
}> {
  try {
    // Check if already exists
    const exists = await certificateExists(supabase, userId, certificateType, accountId);
    if (exists) {
      return {
        success: false,
        error: "Certificate already generated. Each achievement can only be certified once per account.",
      };
    }

    const newCertificateId = generateCertificateId();

    const { data, error } = await supabase
      .from("certificates")
      .insert({
        user_id: userId,
        account_id: accountId || null,
        title,
        description,
        certificate_type: certificateType,
        certificate_id: newCertificateId,
      })
      .select("certificate_id")
      .single();

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      certificateId: data?.certificate_id,
    };
  } catch (err) {
    return {
      success: false,
      error: String(err),
    };
  }
}

/**
 * Get all certificates for a user
 */
export async function getUserCertificates(
  supabase: SupabaseClient,
  userId: string
): Promise<
  Array<{
    id: string;
    title: string;
    description: string | null;
    certificate_type: string;
    certificate_id: string;
    issued_at: string;
    account_name?: string;
  }>
> {
  try {
    const { data } = await supabase
      .from("certificates")
      .select("*")
      .eq("user_id", userId)
      .order("issued_at", { ascending: false });

    if (!data) {
      return [];
    }

    // Fetch account names for certificates with account_id
    const accountIds = Array.from(
      new Set(data.map((c) => c.account_id).filter(Boolean))
    ) as string[];
    let accountMap: Record<string, string> = {};

    if (accountIds.length > 0) {
      const { data: accounts } = await supabase
        .from("capital_accounts")
        .select("id, account_name")
        .in("id", accountIds);

      accountMap =
        accounts?.reduce(
          (acc, curr) => {
            acc[curr.id] = curr.account_name;
            return acc;
          },
          {} as Record<string, string>
        ) || {};
    }

    return data.map((cert) => ({
      id: cert.id,
      title: cert.title,
      description: cert.description,
      certificate_type: cert.certificate_type,
      certificate_id: cert.certificate_id,
      issued_at: cert.issued_at,
      account_name: cert.account_id ? accountMap[cert.account_id] : undefined,
    }));
  } catch (err) {
    console.error("Error getting user certificates:", err);
    return [];
  }
}

/**
 * Get account info for certificate data
 */
export async function getAccountInfo(
  supabase: SupabaseClient,
  accountId: string
): Promise<{
  name: string;
  type: string;
  balance: number;
  accountSize?: number;
} | null> {
  try {
    const { data } = await supabase
      .from("capital_accounts")
      .select("account_name, account_type, balance, account_size")
      .eq("id", accountId)
      .single();

    if (!data) return null;

    return {
      name: data.account_name,
      type: data.account_type,
      balance: Number(data.balance),
      accountSize: data.account_size ? Number(data.account_size) : undefined,
    };
  } catch (err) {
    console.error("Error getting account info:", err);
    return null;
  }
}

/**
 * Get user profile info for certificate
 */
export async function getUserProfileInfo(
  supabase: SupabaseClient,
  userId: string
): Promise<{
  fullName: string;
  email: string;
} | null> {
  try {
    const { data } = await supabase
      .from("profiles")
      .select("first_name, last_name, email")
      .eq("id", userId)
      .single();

    if (!data) return null;

    const fullName = `${data.first_name || ""} ${data.last_name || ""}`.trim();

    return {
      fullName: fullName || "Trader",
      email: data.email,
    };
  } catch (err) {
    console.error("Error getting user profile info:", err);
    return null;
  }
}
