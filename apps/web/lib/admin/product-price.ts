const CURRENCY = process.env.NEXT_PUBLIC_STORE_CURRENCY ?? 'USD';

const ZERO_DECIMAL_CURRENCIES = new Set(['VND', 'JPY']);

export function getStoreCurrency() {
  return CURRENCY;
}

export function isZeroDecimalCurrency() {
  return ZERO_DECIMAL_CURRENCIES.has(CURRENCY);
}

export function parsePriceInput(input: string): number | null {
  const trimmed = input.trim().replace(/,/g, '');
  if (!trimmed) return null;
  const num = Number(trimmed);
  if (!Number.isFinite(num) || num <= 0) return null;
  return isZeroDecimalCurrency() ? Math.round(num) : Math.round(num * 100);
}

export function formatPriceInput(amount: number): string {
  if (isZeroDecimalCurrency()) return String(amount);
  return (amount / 100).toFixed(2);
}

export function getPriceFieldLabel() {
  return isZeroDecimalCurrency() ? `Giá (${CURRENCY})` : 'Giá';
}

export function getCompareAtPriceFieldLabel() {
  return isZeroDecimalCurrency() ? `Giá gốc (${CURRENCY})` : 'Giá gốc';
}

export function defaultProductSku(slug: string) {
  return `${slug}-default`.toUpperCase().replace(/[^A-Z0-9-]/g, '-');
}
