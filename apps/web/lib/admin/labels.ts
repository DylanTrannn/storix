import type { OrderStatus, PaymentStatus, ProductStatus, UserRole } from '@storix/shared';
import {
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
} from '@/lib/order-labels';

export const ADMIN_NAV = {
  dashboard: 'Tổng quan',
  products: 'Sản phẩm',
  collections: 'Bộ sưu tập',
  orders: 'Đơn hàng',
  customers: 'Khách hàng',
  backToStorefront: 'Về cửa hàng',
} as const;

export const PRODUCT_STATUS_LABELS: Record<ProductStatus, string> = {
  draft: 'Bản nháp',
  active: 'Đang bán',
  archived: 'Lưu trữ',
};

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Quản trị viên',
  customer: 'Khách hàng',
};

export function getOrderStatusLabel(status: string): string {
  return ORDER_STATUS_LABELS[status] ?? status;
}

export function getPaymentStatusLabel(status: string): string {
  return PAYMENT_STATUS_LABELS[status] ?? status.replace(/_/g, ' ');
}

export function getPaymentMethodLabel(method: string): string {
  return PAYMENT_METHOD_LABELS[method] ?? method;
}

export function getProductStatusLabel(status: ProductStatus): string {
  return PRODUCT_STATUS_LABELS[status];
}

export function getUserRoleLabel(role: UserRole): string {
  return USER_ROLE_LABELS[role];
}

const ADMIN_DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
};

const ADMIN_DATETIME_OPTIONS: Intl.DateTimeFormatOptions = {
  ...ADMIN_DATE_OPTIONS,
  hour: '2-digit',
  minute: '2-digit',
};

export function formatAdminDate(value: Date | string | number): string {
  return new Date(value).toLocaleDateString('vi-VN', ADMIN_DATE_OPTIONS);
}

export function formatAdminDateTime(value: Date | string | number): string {
  return new Date(value).toLocaleString('vi-VN', ADMIN_DATETIME_OPTIONS);
}
