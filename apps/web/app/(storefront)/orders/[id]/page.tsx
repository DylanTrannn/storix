import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { Separator } from '@storix/ui/separator';
import { getOrder, getOrderPaymentInstructions } from '@/lib/api';
import { OrderLineItems } from '@/components/order/order-line-items';
import { formatPrice, formatVnShippingAddress } from '@/lib/utils';
import { TableSkeleton } from '@/components/skeletons';
import { PaymentInstructions } from '@/components/order/payment-instructions';
import { OrderStatusBanner } from '@/components/order/order-status-banner';
import { CheckoutSteps } from '@/components/checkout/checkout-steps';
import { ORDER_STATUS_LABELS } from '@/lib/order-labels';

interface PageProps {
  params: Promise<{ id: string }>;
}

function isMobileUserAgent(userAgent: string | null): boolean {
  if (!userAgent) return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
}

async function OrderContent({ id }: { id: string }) {
  const headersList = await headers();
  const isMobile = isMobileUserAgent(headersList.get('user-agent'));

  let order;
  try {
    order = await getOrder(id);
  } catch {
    notFound();
  }

  const isBankTransfer = order.paymentMethod === 'bank_transfer';
  let paymentInstructions = null;
  if (isBankTransfer) {
    try {
      paymentInstructions = await getOrderPaymentInstructions(id);
    } catch {
      // instructions unavailable
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold sm:text-3xl">
            Đơn hàng #{order.orderNumber}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Đặt ngày{' '}
            {new Date(order.createdAt).toLocaleDateString('vi-VN', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>
        <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold capitalize">
          {ORDER_STATUS_LABELS[order.status] ?? order.status}
        </span>
      </div>

      <div className="mt-6">
        <OrderStatusBanner order={order} />
      </div>

      {isBankTransfer && paymentInstructions && order.paymentStatus === 'pending' && (
        <div className="mt-8">
          <PaymentInstructions
            instructions={paymentInstructions}
            variant={isMobile ? 'mobile' : 'desktop'}
          />
        </div>
      )}

      <Separator className="my-8" />

      <div className="space-y-6">
        <div>
          <h2 className="font-semibold">Sản phẩm</h2>
          <OrderLineItems items={order.items} className="mt-1" />
        </div>

        <div>
          <h2 className="font-semibold">Giao hàng</h2>
          {order.shippingAddress.recipientName && (
            <p className="mt-2 text-sm font-medium">{order.shippingAddress.recipientName}</p>
          )}
          {order.shippingAddress.phone && (
            <p className="text-sm text-muted-foreground">{order.shippingAddress.phone}</p>
          )}
          <p className="mt-1 text-sm text-muted-foreground">
            {formatVnShippingAddress(order.shippingAddress)}
          </p>
        </div>

        <div className="flex justify-between border-t pt-4 text-lg font-semibold">
          <span>Tổng cộng</span>
          <span className="text-primary">{formatPrice(order.total)}</span>
        </div>
      </div>
    </div>
  );
}

export default async function OrderPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <div className="min-h-dvh bg-stone-50/80">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-10">
        <CheckoutSteps current={3} />
        <Suspense fallback={<TableSkeleton rows={5} />}>
          <OrderContent id={id} />
        </Suspense>
      </div>
    </div>
  );
}
