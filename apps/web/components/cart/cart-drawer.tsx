'use client';

import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { Button } from '@storix/ui/button';
import { Separator } from '@storix/ui/separator';
import { Skeleton } from '@storix/ui/skeleton';
import { CartLineItem } from '@/components/cart/cart-line-item';
import { getStorefrontCart } from '@/lib/api/storefront';
import { useCartDrawer } from '@/lib/stores/cart-drawer';
import { formatPrice } from '@/lib/utils';

export function CartDrawer() {
  const queryClient = useQueryClient();
  const { isOpen, close } = useCartDrawer();
  const { data: cart, isLoading } = useQuery({
    queryKey: ['cart'],
    queryFn: () => getStorefrontCart(),
    enabled: isOpen,
  });

  async function handleCartUpdated() {
    await queryClient.invalidateQueries({ queryKey: ['cart'] });
  }

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/40"
        onClick={close}
        aria-hidden
      />
      <aside
        className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-background shadow-xl"
        role="dialog"
        aria-label="Shopping cart"
      >
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-semibold">Your cart</h2>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={close}
            aria-label="Close cart"
            className="shrink-0"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : cart && cart.items.length > 0 ? (
            <ul className="space-y-5">
              {cart.items.map((item) => (
                <CartLineItem key={item.id} item={item} onUpdated={handleCartUpdated} />
              ))}
            </ul>
          ) : (
            <p className="py-12 text-center text-muted-foreground">Your cart is empty.</p>
          )}
        </div>

        {cart && cart.items.length > 0 && (
          <div className="border-t px-6 py-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-semibold">{formatPrice(cart.subtotal)}</span>
            </div>
            <Separator className="my-4" />
            <div className="grid gap-2">
              <Button asChild onClick={close}>
                <Link href="/cart">View cart</Link>
              </Button>
              <Button asChild variant="outline" onClick={close}>
                <Link href="/checkout">Checkout</Link>
              </Button>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
