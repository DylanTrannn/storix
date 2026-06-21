import Link from 'next/link';
import { Suspense } from 'react';
import { Button } from '@storix/ui/button';
import { Separator } from '@storix/ui/separator';
import { getCart } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { CartItems } from '@/components/cart/cart-items';
import { CheckoutSteps } from '@/components/checkout/checkout-steps';
import { TableSkeleton } from '@/components/skeletons';

async function CartContent() {
  let cart;
  try {
    cart = await getCart();
  } catch {
    return (
      <div className="py-16 text-center">
        <p className="text-muted-foreground">Không thể tải giỏ hàng.</p>
      </div>
    );
  }

  if (cart.items.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-lg font-medium">Giỏ hàng trống</p>
        <p className="mt-2 text-muted-foreground">Thêm sản phẩm bạn yêu thích nhé.</p>
        <Button asChild className="mt-6">
          <Link href="/collections/all">Tiếp tục mua sắm</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-10 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <CartItems
          items={cart.items.map((item) => ({
            id: item.id,
            quantity: item.quantity,
            name: item.variant?.product.name ?? 'Sản phẩm',
            price: item.variant?.price ?? 0,
          }))}
        />
      </div>
      <div className="h-fit rounded-xl border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Tóm tắt đơn hàng</h2>
        <Separator className="my-4" />
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Tạm tính ({cart.itemCount} sản phẩm)</span>
          <span className="font-medium">{formatPrice(cart.subtotal)}</span>
        </div>
        <div className="mt-2 flex justify-between text-sm">
          <span className="text-muted-foreground">Phí vận chuyển</span>
          <span className="font-medium text-emerald-600">Miễn phí</span>
        </div>
        <Separator className="my-4" />
        <div className="flex justify-between font-semibold">
          <span>Tổng cộng</span>
          <span className="text-primary">{formatPrice(cart.subtotal)}</span>
        </div>
        <Button asChild className="mt-6 w-full" size="lg">
          <Link href="/checkout">Thanh toán</Link>
        </Button>
      </div>
    </div>
  );
}

export default function CartPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
      <CheckoutSteps current={1} />
      <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold sm:text-3xl">
        Giỏ hàng
      </h1>
      <Suspense fallback={<TableSkeleton rows={3} />}>
        <div className="mt-8">
          <CartContent />
        </div>
      </Suspense>
    </div>
  );
}
