const DEFAULT_CURRENCY = process.env.NEXT_PUBLIC_STORE_CURRENCY ?? 'USD';

export function formatPrice(amount: number, currency = DEFAULT_CURRENCY): string {
  const isZeroDecimal = currency === 'VND' || currency === 'JPY';
  const value = isZeroDecimal ? amount : amount / 100;
  const locale = currency === 'VND' ? 'vi-VN' : 'en-US';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(value);
}

export function formatPaymentAmount(amount: number, currency = DEFAULT_CURRENCY): string {
  return formatPrice(amount, currency);
}

export function getProductMinPrice(variants: { price: number }[]): number | null {
  if (variants.length === 0) return null;
  return Math.min(...variants.map((v) => v.price));
}

export function getVariantLabel(options: Record<string, string>): string {
  const values = Object.values(options);
  return values.length > 0 ? values.join(' / ') : 'Default';
}

export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}

export { formatVnShippingAddress } from '@storix/shared';
