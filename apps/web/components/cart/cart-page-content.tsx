'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@storix/ui/button';
import { Separator } from '@storix/ui/separator';
import { CartLineItem } from '@/components/cart/cart-line-item';
import { CheckoutSteps } from '@/components/checkout/checkout-steps';
import { TableSkeleton } from '@/components/skeletons';
import { getStorefrontCart } from '@/lib/api/storefront';
import { formatPrice } from '@/lib/utils';

export function CartPageContent() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: cart, isLoading, isError } = useQuery({
    queryKey: ['cart'],
    queryFn: () => getStorefrontCart(),
  });

  async function handleCartUpdated() {
    await queryClient.invalidateQueries({ queryKey: ['cart'] });
    router.refresh();
  }

  if (isLoading) {
    return <TableSkeleton rows={3} />;
  }

  if (isError) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted-foreground">Không thể tải giỏ hàng.</p>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
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
        <ul className="divide-y">
          {cart.items.map((item) => (
            <CartLineItem
              key={item.id}
              item={item}
              onUpdated={handleCartUpdated}
              className="py-6"
            />
          ))}
        </ul>
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

export function CartPageShell() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
      <CheckoutSteps current={1} />
      <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold sm:text-3xl">
        Giỏ hàng
      </h1>
      <div className="mt-8">
        <CartPageContent />
      </div>
    </div>
  );
}
