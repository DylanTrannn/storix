import { notFound, redirect } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';
import { Button } from '@storix/ui/button';
import { getOrder, getOrderPaymentInstructions } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { TableSkeleton } from '@/components/skeletons';
import { PaymentInstructions } from '@/components/order/payment-instructions';
import { PayOrderSummary } from '@/components/order/pay-order-summary';
import { CheckoutSteps } from '@/components/checkout/checkout-steps';

interface PageProps {
  params: Promise<{ id: string }>;
}

async function PayContent({ id }: { id: string }) {
  let order;
  let instructions;
  try {
    [order, instructions] = await Promise.all([
      getOrder(id),
      getOrderPaymentInstructions(id),
    ]);
  } catch {
    notFound();
  }

  if (order.paymentMethod !== 'bank_transfer') {
    notFound();
  }

  if (order.paymentStatus !== 'pending') {
    redirect(`/orders/${id}`);
  }

  return (
    <>
      <div className="grid gap-6 pb-20 lg:grid-cols-5 lg:gap-8 lg:pb-0">
        {/* Left: payment instructions */}
        <div className="space-y-5 lg:col-span-3">
          <Button variant="ghost" size="sm" asChild className="-ml-2">
            <Link href={`/orders/${id}`}>← Quay lại đơn hàng</Link>
          </Button>

          <PaymentInstructions instructions={instructions} variant="mobile" />
        </div>

        {/* Right: sticky order summary (desktop) */}
        <div className="hidden lg:col-span-2 lg:block">
          <div className="sticky top-24 rounded-xl border bg-card p-6 shadow-sm">
            <PayOrderSummary order={order} />
          </div>
        </div>

        {/* Mobile order summary */}
        <div className="rounded-xl border bg-card p-5 shadow-sm lg:hidden">
          <PayOrderSummary order={order} />
        </div>
      </div>

      {/* Mobile sticky total */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-card/95 p-4 backdrop-blur supports-[backdrop-filter]:bg-card/80 lg:hidden">
        <div className="mx-auto flex max-w-lg items-center gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground">Tổng thanh toán</p>
            <p className="text-lg font-bold text-primary">{formatPrice(order.total)}</p>
          </div>
          <p className="shrink-0 text-xs text-muted-foreground">Đơn #{order.orderNumber}</p>
        </div>
      </div>
    </>
  );
}

export default async function OrderPayPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <div className="min-h-dvh bg-stone-50/80">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
        <CheckoutSteps current={3} />

        <div className="mb-8 text-center sm:text-left">
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight sm:text-3xl">
            Thanh toán chuyển khoản
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Quét mã VietQR hoặc chuyển khoản thủ công
          </p>
        </div>

        <Suspense fallback={<TableSkeleton rows={6} />}>
          <PayContent id={id} />
        </Suspense>
      </div>
    </div>
  );
}
