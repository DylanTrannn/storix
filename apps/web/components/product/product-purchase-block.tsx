'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import type { ProductVariant } from '@storix/shared';
import { Button } from '@storix/ui/button';
import { addToStorefrontCart } from '@/lib/api/storefront';
import { useCartDrawer } from '@/lib/stores/cart-drawer';
import {
  extractOptionDimensions,
  findVariantByOptions,
  hasMultipleVariants,
  isVariantAvailable,
} from '@/lib/product/variants';
import { formatPrice, cn } from '@/lib/utils';
import { QuantityInput } from './quantity-input';
import { VariantOptionPicker } from './variant-option-picker';

export type PurchaseVariant = Pick<
  ProductVariant,
  'id' | 'price' | 'compareAtPrice' | 'inventory' | 'options' | 'imageUrl'
>;

interface ProductPurchaseBlockProps {
  variants: PurchaseVariant[];
  size?: 'default' | 'compact';
  onVariantChange?: (variant: PurchaseVariant | null) => void;
  onSelectionChange?: (selection: Record<string, string>) => void;
}

function buildInitialSelection(variants: PurchaseVariant[]): Record<string, string> {
  const available = variants.find(isVariantAvailable) ?? variants[0];
  if (!available) return {};

  const dimensions = extractOptionDimensions(variants);
  const selection: Record<string, string> = {};
  for (const dimension of dimensions) {
    const value = available.options?.[dimension.name];
    if (value) selection[dimension.name] = value;
  }
  return selection;
}

export function ProductPurchaseBlock({
  variants,
  size = 'default',
  onVariantChange,
  onSelectionChange,
}: ProductPurchaseBlockProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const openCart = useCartDrawer((s) => s.open);
  const [selection, setSelection] = useState<Record<string, string>>(() =>
    buildInitialSelection(variants),
  );
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedVariant = useMemo(
    () => findVariantByOptions(variants, selection),
    [variants, selection],
  );

  useEffect(() => {
    onVariantChange?.(selectedVariant);
  }, [selectedVariant, onVariantChange]);

  useEffect(() => {
    onSelectionChange?.(selection);
  }, [selection, onSelectionChange]);

  useEffect(() => {
    setQuantity(1);
  }, [selectedVariant?.id]);

  const isCompact = size === 'compact';
  const isOutOfStock = !selectedVariant || !isVariantAvailable(selectedVariant);
  const maxQuantity = selectedVariant?.inventory ?? 1;
  const showLowStock =
    selectedVariant && selectedVariant.inventory > 0 && selectedVariant.inventory <= 5;

  async function handleAddToCart() {
    if (!selectedVariant) return;
    setIsLoading(true);
    setError(null);
    try {
      await addToStorefrontCart({ variantId: selectedVariant.id, quantity });
      await queryClient.invalidateQueries({ queryKey: ['cart'] });
      openCart();
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not add to cart. Please try again.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  if (variants.length === 0) {
    return (
      <Button disabled className={cn('w-full', isCompact ? 'h-10' : 'h-12')}>
        Unavailable
      </Button>
    );
  }

  return (
    <div
      className={cn(
        isCompact ? 'space-y-3' : 'space-y-5 rounded-xl border border-border bg-card p-5 shadow-sm',
      )}
    >
      {selectedVariant && (
        <div className="space-y-1">
          <div className="flex flex-wrap items-baseline gap-2">
            <p
              className={cn(
                'font-semibold tracking-tight',
                isCompact ? 'text-2xl' : 'text-3xl',
              )}
            >
              {formatPrice(selectedVariant.price)}
            </p>
            {selectedVariant.compareAtPrice &&
              selectedVariant.compareAtPrice > selectedVariant.price && (
                <p className="text-sm text-muted-foreground line-through">
                  {formatPrice(selectedVariant.compareAtPrice)}
                </p>
              )}
          </div>
          {showLowStock && (
            <p className="text-sm font-medium text-amber-700">
              Only {selectedVariant.inventory} left in stock
            </p>
          )}
        </div>
      )}

      {hasMultipleVariants(variants) && (
        <VariantOptionPicker
          variants={variants}
          selection={selection}
          onSelectionChange={setSelection}
          compact={isCompact}
        />
      )}

      {!isOutOfStock && (
        <div className={cn('space-y-2', isCompact && 'space-y-1.5')}>
          <p className={cn('font-medium', isCompact ? 'text-xs' : 'text-sm')}>Quantity</p>
          <QuantityInput
            value={quantity}
            onChange={setQuantity}
            max={maxQuantity}
            compact={isCompact}
          />
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button
        className={cn('w-full', isCompact ? 'h-10 text-sm' : 'h-12 text-base')}
        size={isCompact ? 'default' : 'lg'}
        disabled={isOutOfStock || isLoading}
        onClick={handleAddToCart}
      >
        {isOutOfStock ? 'Sold out' : isLoading ? 'Adding…' : 'Add to cart'}
      </Button>
    </div>
  );
}
