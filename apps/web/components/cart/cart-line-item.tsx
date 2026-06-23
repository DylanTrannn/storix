'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { Trash2 } from 'lucide-react';
import type { CartItem } from '@storix/shared';
import { Button } from '@storix/ui/button';
import { cn, formatPrice } from '@/lib/utils';
import {
  findVariantByOptions,
  hasMultipleVariants,
} from '@/lib/product/variants';
import {
  removeStorefrontCartItem,
  updateStorefrontCartItem,
} from '@/lib/api/storefront';
import { QuantityInput } from '@/components/product/quantity-input';
import { VariantOptionPicker } from '@/components/product/variant-option-picker';

interface CartLineItemProps {
  item: CartItem;
  onUpdated?: () => void;
  className?: string;
}

export function CartLineItem({ item, onUpdated, className }: CartLineItemProps) {
  const [quantity, setQuantity] = useState(item.quantity);
  const [selection, setSelection] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const variant = item.variant;
  const productVariants = item.productVariants ?? [];
  const productName = variant?.product.name ?? 'Product';
  const unitPrice = variant?.price ?? 0;
  const imageUrl = variant?.imageUrl;
  const maxQuantity = variant?.inventory && variant.inventory > 0 ? variant.inventory : 99;

  const pickerVariants = useMemo(
    () =>
      productVariants.map((v) => ({
        id: v.id,
        options: v.options,
        inventory: v.inventory,
        price: v.price,
        imageUrl: v.imageUrl,
      })),
    [productVariants],
  );

  useEffect(() => {
    setQuantity(item.quantity);
  }, [item.quantity]);

  useEffect(() => {
    if (variant?.options) {
      setSelection(variant.options);
    }
  }, [variant?.options, item.variantId]);

  async function handleVariantSelectionChange(nextSelection: Record<string, string>) {
    setSelection(nextSelection);
    const nextVariant = findVariantByOptions(pickerVariants, nextSelection);
    if (!nextVariant || nextVariant.id === item.variantId) return;

    setIsLoading(true);
    setError(null);
    try {
      await updateStorefrontCartItem(item.id, { variantId: nextVariant.id });
      onUpdated?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not update variant';
      setError(message);
      if (variant?.options) setSelection(variant.options);
    } finally {
      setIsLoading(false);
    }
  }

  async function commitQuantity(nextQuantity: number) {
    if (nextQuantity === item.quantity) return;

    setIsLoading(true);
    setError(null);
    try {
      await updateStorefrontCartItem(item.id, { quantity: nextQuantity });
      onUpdated?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not update quantity';
      setError(message);
      setQuantity(item.quantity);
    } finally {
      setIsLoading(false);
    }
  }

  function handleQuantityChange(nextQuantity: number) {
    setQuantity(nextQuantity);
    void commitQuantity(nextQuantity);
  }

  async function handleRemove() {
    setIsLoading(true);
    try {
      await removeStorefrontCartItem(item.id);
      onUpdated?.();
    } catch {
      setError('Could not remove item');
    } finally {
      setIsLoading(false);
    }
  }

  const showVariantPicker =
    pickerVariants.length > 0 && hasMultipleVariants(pickerVariants);

  return (
    <li className={cn('flex gap-3', className)}>
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={productName}
            fill
            sizes="80px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
            No image
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate font-medium">{productName}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {formatPrice(unitPrice)} each
            </p>
          </div>
          <p className="shrink-0 text-sm font-semibold">
            {formatPrice(unitPrice * item.quantity)}
          </p>
        </div>

        {showVariantPicker && (
          <div className="mt-3">
            <VariantOptionPicker
              variants={pickerVariants}
              selection={selection}
              onSelectionChange={handleVariantSelectionChange}
              compact
            />
          </div>
        )}

        <div className="mt-3 flex items-center gap-2">
          <QuantityInput
            value={quantity}
            onChange={handleQuantityChange}
            max={maxQuantity}
            disabled={isLoading}
            compact
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
            disabled={isLoading}
            onClick={handleRemove}
            aria-label={`Remove ${productName} from cart`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
      </div>
    </li>
  );
}
