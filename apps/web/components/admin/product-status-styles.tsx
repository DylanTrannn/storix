import type { ProductStatus } from '@storix/shared';
import { cn } from '@/lib/utils';
import { getProductStatusLabel } from '@/lib/admin/labels';

export const PRODUCT_STATUSES: ProductStatus[] = ['draft', 'active', 'archived'];

const productStatusStyles: Record<
  ProductStatus,
  { trigger: string; dot: string; badge: string }
> = {
  active: {
    trigger: 'border-emerald-300 bg-emerald-100 text-emerald-900 hover:bg-emerald-100',
    dot: 'bg-emerald-600',
    badge: 'bg-emerald-200 text-emerald-900',
  },
  draft: {
    trigger: 'border-amber-300 bg-amber-100 text-amber-950 hover:bg-amber-100',
    dot: 'bg-amber-600',
    badge: 'bg-amber-200 text-amber-950',
  },
  archived: {
    trigger: 'border-stone-300 bg-stone-200 text-stone-600 hover:bg-stone-200',
    dot: 'bg-stone-500',
    badge: 'bg-stone-200 text-stone-600',
  },
};

export function getProductStatusStyles(status: ProductStatus) {
  return productStatusStyles[status];
}

export function ProductStatusLabel({ status }: { status: ProductStatus }) {
  const { dot } = getProductStatusStyles(status);

  return (
    <span className="flex items-center gap-2">
      <span className={cn('h-2 w-2 shrink-0 rounded-full', dot)} aria-hidden />
      {getProductStatusLabel(status)}
    </span>
  );
}

export function getProductStatusBadgeClass(status: ProductStatus) {
  return productStatusStyles[status].badge;
}
