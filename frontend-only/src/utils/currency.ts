/**
 * Approximate exchange rates to KRW.
 * In production, these would be fetched from an exchange rate API.
 */
const RATES_TO_KRW: Record<string, number> = {
  KRW: 1,
  EUR: 1_500,
  USD: 1_380,
  GBP: 1_750,
  JPY: 9.2,
};

/** Convert an amount from `currency` to KRW. Returns rounded integer. */
export function toKRW(amount: number, currency: string): number {
  const rate = RATES_TO_KRW[currency.toUpperCase()] ?? 1;
  return Math.round(amount * rate);
}

/** Format a KRW amount as a display string, e.g. "₩1,234,567" */
export function formatKRW(amount: number): string {
  return `₩${amount.toLocaleString('ko-KR')}`;
}

/** Convert + format in one call */
export function priceToKRW(amount: number, currency: string): string {
  return formatKRW(toKRW(amount, currency));
}
