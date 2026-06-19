'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import type { CartItem } from '@storix/shared';
import { Button } from '@storix/ui/button';
import { Input } from '@storix/ui/input';
import { cn, formatPrice, getVariantLabel } from '@/lib/utils';
import {
  removeStorefrontCartItem,
  updateStorefrontCartItem,
} from '@/lib/api/storefront';

interface CartLineItemProps {
  item: CartItem;
  onUpdated?: () => void;
  className?: string;
}

export function CartLineItem({ item, onUpdated, className }: CartLineItemProps) {
  const [quantity, setQuantity] = useState(String(item.quantity));
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const variant = item.variant;
  const maxQuantity = variant?.inventory && variant.inventory > 0 ? variant.inventory : 99;
  const productName = variant?.product.name ?? 'Product';
  const unitPrice = variant?.price ?? 0;
  const imageUrl = variant?.imageUrl;
  const variantLabel = variant ? getVariantLabel(variant.options) : null;

  useEffect(() => {
    setQuantity(String(item.quantity));
  }, [item.quantity]);

  function validateQuantity(value: string): number | null {
    const trimmed = value.trim();
    if (!trimmed) {
      setError('Enter a quantity');
      return null;
    }

    const parsed = Number(trimmed);
    if (!Number.isInteger(parsed)) {
      setError('Quantity must be a whole number');
      return null;
    }
    if (parsed < 1) {
      setError('Minimum quantity is 1');
      return null;
    }
    if (parsed > maxQuantity) {
      setError(`Maximum available is ${maxQuantity}`);
      return null;
    }

    setError(null);
    return parsed;
  }

  async function commitQuantity(nextQuantity: number) {
    if (nextQuantity === item.quantity) return;

    setIsLoading(true);
    try {
      await updateStorefrontCartItem(item.id, { quantity: nextQuantity });
      onUpdated?.();
    } catch {
      setError('Could not update quantity');
      setQuantity(String(item.quantity));
    } finally {
      setIsLoading(false);
    }
  }

  function handleQuantityBlur() {
    const parsed = validateQuantity(quantity);
    if (parsed === null) {
      setQuantity(String(item.quantity));
      return;
    }
    commitQuantity(parsed);
  }

  function handleQuantityChange(value: string) {
    setQuantity(value);
    if (error) validateQuantity(value);
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
            {variantLabel && (
              <p className="text-xs text-muted-foreground">{variantLabel}</p>
            )}
            <p className="mt-1 text-sm text-muted-foreground">
              {formatPrice(unitPrice)} each
            </p>
          </div>
          <p className="shrink-0 text-sm font-semibold">
            {formatPrice(unitPrice * item.quantity)}
          </p>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <label htmlFor={`cart-qty-${item.id}`} className="sr-only">
            Quantity for {productName}
          </label>
          <Input
            id={`cart-qty-${item.id}`}
            type="number"
            min={1}
            max={maxQuantity}
            step={1}
            value={quantity}
            disabled={isLoading}
            onChange={(e) => handleQuantityChange(e.target.value)}
            onBlur={handleQuantityBlur}
            className="h-9 w-20 bg-background"
            aria-invalid={error ? true : undefined}
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
