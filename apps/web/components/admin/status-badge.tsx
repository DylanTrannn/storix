import { cn } from '@/lib/utils';
import { getProductStatusBadgeClass } from '@/components/admin/product-status-styles';
import {
  getOrderStatusLabel,
  getPaymentStatusLabel,
  getProductStatusLabel,
} from '@/lib/admin/labels';
import { ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from '@/lib/order-labels';
import type { ProductStatus } from '@storix/shared';

const statusStyles: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-900',
  confirmed: 'bg-blue-100 text-blue-800',
  processing: 'bg-indigo-100 text-indigo-800',
  shipped: 'bg-violet-100 text-violet-800',
  completed: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-red-100 text-red-800',
  awaiting_review: 'bg-blue-100 text-blue-800',
  not_required: 'bg-stone-100 text-stone-600',
  rejected: 'bg-red-100 text-red-800',
};

function getStatusClass(status: string) {
  if (status === 'active' || status === 'draft' || status === 'archived') {
    return getProductStatusBadgeClass(status as ProductStatus);
  }
  return statusStyles[status] ?? 'bg-muted text-muted-foreground';
}

function getStatusLabel(status: string) {
  if (status === 'active' || status === 'draft' || status === 'archived') {
    return getProductStatusLabel(status);
  }
  if (status in ORDER_STATUS_LABELS) {
    return getOrderStatusLabel(status);
  }
  if (status in PAYMENT_STATUS_LABELS) {
    return getPaymentStatusLabel(status);
  }
  return status;
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        'inline-flex w-fit shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium',
        getStatusClass(status),
      )}
    >
      {getStatusLabel(status)}
    </span>
  );
}
