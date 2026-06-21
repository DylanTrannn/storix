import { notFound } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { Separator } from '@storix/ui/separator';
import { getAdminOrder } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { formatAdminDateTime } from '@/lib/admin/labels';
import { formatVnShippingAddress } from '@storix/shared';
import { StatusBadge } from '@/components/admin/status-badge';
import { TableSkeleton } from '@/components/skeletons';

const OrderStatusForm = dynamic(
  () => import('@/components/admin/order-status-form').then((m) => m.OrderStatusForm),
  { loading: () => <TableSkeleton rows={2} /> },
);

const PaymentConfirmForm = dynamic(
  () => import('@/components/admin/payment-confirm-form').then((m) => m.PaymentConfirmForm),
  { loading: () => <TableSkeleton rows={2} /> },
);

interface PageProps {
  params: Promise<{ id: string }>;
}

async function OrderDetail({ id }: { id: string }) {
  let order;
  try {
    order = await getAdminOrder(id);
  } catch {
    notFound();
  }

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Đơn hàng #{order.orderNumber}</h1>
            <p className="text-sm text-muted-foreground">
              {formatAdminDateTime(order.createdAt)}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <StatusBadge status={order.status} />
            {order.paymentMethod === 'bank_transfer' && (
              <StatusBadge status={order.paymentStatus} />
            )}
          </div>
        </div>

        <Separator />

        <ul className="divide-y text-sm">
          {order.items.map((item) => (
            <li key={item.id} className="flex justify-between py-3">
              <div>
                <p className="font-medium">{item.productName}</p>
                <p className="text-muted-foreground">SL {item.quantity}</p>
              </div>
              <p>{formatPrice(item.price * item.quantity)}</p>
            </li>
          ))}
        </ul>

        <div className="flex justify-between border-t pt-4 font-semibold">
          <span>Tổng cộng</span>
          <span>{formatPrice(order.total)}</span>
        </div>
      </div>

      <div className="space-y-6">
        {order.paymentMethod === 'bank_transfer' && (
          <PaymentConfirmForm
            orderId={order.id}
            paymentStatus={order.paymentStatus}
            transferReference={order.transferReference}
            customerMarkedPaidAt={order.customerMarkedPaidAt}
          />
        )}
        <OrderStatusForm orderId={order.id} currentStatus={order.status} />
        <div className="rounded-lg border p-4 text-sm">
          <h2 className="font-medium">Giao hàng</h2>
          {order.shippingAddress.recipientName && (
            <p className="mt-2 font-medium">{order.shippingAddress.recipientName}</p>
          )}
          {order.shippingAddress.phone && (
            <p className="text-muted-foreground">{order.shippingAddress.phone}</p>
          )}
          <p className="mt-1 text-muted-foreground">
            {formatVnShippingAddress(order.shippingAddress)}
          </p>
          {order.guestEmail && (
            <p className="mt-2 text-muted-foreground">Email: {order.guestEmail}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default async function AdminOrderPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <Suspense fallback={<TableSkeleton rows={6} />}>
      <OrderDetail id={id} />
    </Suspense>
  );
}
