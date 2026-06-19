import Link from 'next/link';
import { Suspense } from 'react';
import { Button } from '@storix/ui/button';
import { Separator } from '@storix/ui/separator';
import { getCart } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { CartItems } from '@/components/cart/cart-items';
import { TableSkeleton } from '@/components/skeletons';

async function CartContent() {
  let cart;
  try {
    cart = await getCart();
  } catch {
    return (
      <div className="py-16 text-center">
        <p className="text-muted-foreground">Unable to load your cart.</p>
      </div>
    );
  }

  if (cart.items.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-lg font-medium">Your cart is empty</p>
        <p className="mt-2 text-muted-foreground">Add something you love.</p>
        <Button asChild className="mt-6">
          <Link href="/collections/all">Continue shopping</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-10 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <CartItems items={cart.items.map((item) => ({
          id: item.id,
          quantity: item.quantity,
          name: item.variant?.product.name ?? 'Product',
          price: item.variant?.price ?? 0,
        }))} />
      </div>
      <div className="h-fit rounded-lg border p-6">
        <h2 className="text-lg font-semibold">Order summary</h2>
        <Separator className="my-4" />
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Subtotal ({cart.itemCount} items)</span>
          <span className="font-medium">{formatPrice(cart.subtotal)}</span>
        </div>
        <Button asChild className="mt-6 w-full" size="lg">
          <Link href="/checkout">Proceed to checkout</Link>
        </Button>
      </div>
    </div>
  );
}

export default function CartPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-[family-name:var(--font-display)] text-4xl font-semibold">Cart</h1>
      <Suspense fallback={<TableSkeleton rows={3} />}>
        <div className="mt-8">
          <CartContent />
        </div>
      </Suspense>
    </div>
  );
}
