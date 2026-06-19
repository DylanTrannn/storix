import { notFound } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { Badge } from '@storix/ui/badge';
import { Separator } from '@storix/ui/separator';
import { getAdminOrder } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { TableSkeleton } from '@/components/skeletons';

const OrderStatusForm = dynamic(
  () => import('@/components/admin/order-status-form').then((m) => m.OrderStatusForm),
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
            <h1 className="text-2xl font-semibold">Order #{order.id.slice(0, 8)}</h1>
            <p className="text-sm text-muted-foreground">
              {new Date(order.createdAt).toLocaleString()}
            </p>
          </div>
          <Badge className="capitalize">{order.status}</Badge>
        </div>

        <Separator />

        <ul className="divide-y text-sm">
          {order.items.map((item) => (
            <li key={item.id} className="flex justify-between py-3">
              <div>
                <p className="font-medium">{item.productName}</p>
                <p className="text-muted-foreground">Qty {item.quantity}</p>
              </div>
              <p>{formatPrice(item.price * item.quantity)}</p>
            </li>
          ))}
        </ul>

        <div className="flex justify-between border-t pt-4 font-semibold">
          <span>Total</span>
          <span>{formatPrice(order.total)}</span>
        </div>
      </div>

      <div className="space-y-6">
        <OrderStatusForm orderId={order.id} currentStatus={order.status} />
        <div className="rounded-lg border p-4 text-sm">
          <h2 className="font-medium">Shipping</h2>
          <p className="mt-2 text-muted-foreground">
            {order.shippingAddress.line1}
            <br />
            {order.shippingAddress.city}, {order.shippingAddress.state}{' '}
            {order.shippingAddress.postalCode}
          </p>
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
