export const USER_ROLES = ['admin', 'customer'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const PRODUCT_STATUSES = ['draft', 'active', 'archived'] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

export const ORDER_STATUSES = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'completed',
  'cancelled',
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_METHODS = ['cash_on_delivery', 'bank_transfer'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_STATUSES = [
  'pending',
  'awaiting_review',
  'confirmed',
  'rejected',
  'not_required',
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

/** NAPAS BIN codes for VietQR generation */
export const BANK_BINS = {
  VCB: '970436',
  TCB: '970407',
  BIDV: '970418',
  VBA: '970405',
  MB: '970422',
  ACB: '970416',
  VPB: '970432',
  TPB: '970423',
  STB: '970403',
  HDB: '970437',
  OCB: '970448',
  SHB: '970443',
  MSB: '970426',
  SEA: '970440',
  VIB: '970441',
} as const;

export type BankCode = keyof typeof BANK_BINS;

export const SORT_DIRECTIONS = ['asc', 'desc'] as const;
export type SortDirection = (typeof SORT_DIRECTIONS)[number];

export const PRODUCT_SORT_FIELDS = ['name', 'createdAt', 'updatedAt', 'price'] as const;
export type ProductSortField = (typeof PRODUCT_SORT_FIELDS)[number];
