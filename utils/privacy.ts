import { usePrivacy } from "@/contexts/PrivacyContext";

/**
 * Hook to conditionally mask or display a value based on privacy mode
 */
export function useMaskedValue() {
  const { privacyMode } = usePrivacy();

  return {
    privacyMode,
    mask: (value: string | number) => {
      if (!privacyMode) return String(value);
      return "*****";
    },
    maskDollar: (value: number | string) => {
      if (!privacyMode) return `$${value}`;
      return "*****";
    },
  };
}

/**
 * Format a currency value with privacy masking support
 */
export function formatValueWithPrivacy(value: number | string, privacyMode: boolean): string {
  if (privacyMode) return "*****";
  if (typeof value === "number") {
    return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  return value;
}

/**
 * Format a currency value with $ prefix and privacy masking
 */
export function formatDollarWithPrivacy(value: number | string, privacyMode: boolean): string {
  if (privacyMode) return "*****";
  if (typeof value === "number") {
    return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `$${value}`;
}

/**
 * Format a PnL value with sign and privacy masking
 */
export function formatPnLWithPrivacy(value: number, privacyMode: boolean): string {
  if (privacyMode) return "*****";
  const sign = value >= 0 ? "+" : "";
  return `${sign}$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
