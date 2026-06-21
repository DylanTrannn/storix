'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { ProductStatus } from '@storix/shared';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@storix/ui/select';
import { cn } from '@/lib/utils';
import { updateProductAction } from '@/lib/actions/admin';
import {
  getProductStatusStyles,
  PRODUCT_STATUSES,
  ProductStatusLabel,
} from '@/components/admin/product-status-styles';

interface ProductStatusSelectProps {
  productId: string;
  value: ProductStatus;
}

export function ProductStatusSelect({ productId, value }: ProductStatusSelectProps) {
  const router = useRouter();
  const [status, setStatus] = useState(value);
  const [isUpdating, setIsUpdating] = useState(false);

  async function handleChange(next: ProductStatus) {
    if (next === status) return;
    const previous = status;
    setStatus(next);
    setIsUpdating(true);
    try {
      await updateProductAction(productId, { status: next });
      router.refresh();
    } catch {
      setStatus(previous);
    } finally {
      setIsUpdating(false);
    }
  }

  const currentStyles = getProductStatusStyles(status);

  return (
    <Select value={status} onValueChange={(v) => void handleChange(v as ProductStatus)} disabled={isUpdating}>
      <SelectTrigger
        className={cn(
          'h-8 w-[8.5rem] cursor-pointer border font-medium capitalize',
          currentStyles.trigger,
        )}
        aria-label="Product status"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {PRODUCT_STATUSES.map((s) => (
          <SelectItem key={s} value={s} className="cursor-pointer">
            <ProductStatusLabel status={s} />
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
