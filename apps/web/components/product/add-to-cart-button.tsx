'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import type { ProductVariant } from '@storix/shared';
import { Button } from '@storix/ui/button';
import { Label } from '@storix/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@storix/ui/select';
import { addToStorefrontCart, addToStorefrontWishlist, removeFromStorefrontWishlist } from '@/lib/api/storefront';
import { useCartDrawer } from '@/lib/stores/cart-drawer';
import { formatPrice, getVariantLabel } from '@/lib/utils';

interface AddToCartButtonProps {
  variants: Pick<ProductVariant, 'id' | 'price' | 'inventory' | 'options'>[];
}

export function AddToCartButton({ variants }: AddToCartButtonProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const openCart = useCartDrawer((s) => s.open);
  const [variantId, setVariantId] = useState(variants[0]?.id ?? '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selected = variants.find((v) => v.id === variantId);
  const isOutOfStock = !selected || selected.inventory <= 0;

  async function handleAddToCart() {
    if (!variantId) return;
    setIsLoading(true);
    setError(null);
    try {
      await addToStorefrontCart({ variantId, quantity: 1 });
      await queryClient.invalidateQueries({ queryKey: ['cart'] });
      openCart();
      router.refresh();
    } catch {
      setError('Could not add to cart. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  if (variants.length === 0) {
    return (
      <Button disabled className="h-12 w-full">
        Unavailable
      </Button>
    );
  }

  return (
    <div className="space-y-5 rounded-xl border border-border bg-card p-5 shadow-sm">
      {selected && (
        <p className="text-3xl font-semibold tracking-tight">{formatPrice(selected.price)}</p>
      )}

      {variants.length > 1 && (
        <div className="space-y-2">
          <Label htmlFor="variant">Variant</Label>
          <Select value={variantId} onValueChange={setVariantId}>
            <SelectTrigger id="variant" className="bg-background">
              <SelectValue placeholder="Select variant" />
            </SelectTrigger>
            <SelectContent side="bottom" align="start">
              {variants.map((variant) => (
                <SelectItem key={variant.id} value={variant.id} disabled={variant.inventory <= 0}>
                  {getVariantLabel(variant.options)}
                  {variant.inventory <= 0 ? ' — Sold out' : ` — ${formatPrice(variant.price)}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button
        className="h-12 w-full text-base"
        size="lg"
        disabled={isOutOfStock || isLoading}
        onClick={handleAddToCart}
      >
        {isOutOfStock ? 'Sold out' : isLoading ? 'Adding…' : 'Add to cart'}
      </Button>
    </div>
  );
}

interface WishlistButtonProps {
  productId: string;
}

export function WishlistButton({ productId }: WishlistButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleToggle() {
    setIsLoading(true);
    setError(null);
    try {
      if (added) {
        await removeFromStorefrontWishlist(productId);
        setAdded(false);
      } else {
        await addToStorefrontWishlist({ productId });
        setAdded(true);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Request failed';
      if (message.toLowerCase().includes('sign in')) {
        router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
        return;
      }
      setError('Could not update wishlist. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button
        variant="outline"
        className="h-12 w-full text-base"
        size="lg"
        disabled={isLoading}
        onClick={handleToggle}
      >
        {added ? 'Remove from wishlist' : 'Add to wishlist'}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
