import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { getCart } from '@/lib/api';
import { CheckoutForm } from '@/components/checkout/checkout-form';
import { CheckoutSteps } from '@/components/checkout/checkout-steps';
import { TableSkeleton } from '@/components/skeletons';

async function CheckoutContent() {
  let cart;
  try {
    cart = await getCart();
  } catch {
    return (
      <div className="py-16 text-center">
        <p className="text-muted-foreground">Không thể tải giỏ hàng.</p>
        <Link href="/cart" className="mt-4 inline-block text-sm font-medium text-primary hover:underline">
          Quay lại giỏ hàng
        </Link>
      </div>
    );
  }

  if (cart.items.length === 0) {
    redirect('/cart');
  }

  return <CheckoutForm cart={cart} />;
}

export default function CheckoutPage() {
  return (
    <div className="min-h-dvh bg-stone-50/80">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
        <CheckoutSteps current={2} />

        <div className="mb-8 text-center sm:text-left">
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight sm:text-3xl">
            Thanh toán
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Điền thông tin giao hàng và chọn phương thức thanh toán
          </p>
        </div>

        <Suspense fallback={<TableSkeleton rows={8} />}>
          <CheckoutContent />
        </Suspense>
      </div>
    </div>
  );
}
