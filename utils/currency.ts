/**
 * Format currency in South African Rand (ZAR)
 */
export function formatZAR(amount: number): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Parse ZAR formatted string back to number
 */
export function parseZAR(value: string): number {
  // Remove currency symbol and spaces, replace comma with dot for parsing
  const cleaned = value.replace(/R\s?/g, '').replace(/\s/g, '').replace(/,/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}