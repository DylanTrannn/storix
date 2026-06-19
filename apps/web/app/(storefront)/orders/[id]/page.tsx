import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { Badge } from '@storix/ui/badge';
import { Separator } from '@storix/ui/separator';
import { getOrder } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { TableSkeleton } from '@/components/skeletons';

interface PageProps {
  params: Promise<{ id: string }>;
}

async function OrderContent({ id }: { id: string }) {
  let order;
  try {
    order = await getOrder(id);
  } catch {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold">
            Order #{order.id.slice(0, 8)}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Placed {new Date(order.createdAt).toLocaleDateString()}
          </p>
        </div>
        <Badge className="capitalize">{order.status}</Badge>
      </div>

      <Separator className="my-8" />

      <div className="space-y-6">
        <div>
          <h2 className="font-medium">Items</h2>
          <ul className="mt-3 divide-y">
            {order.items.map((item) => (
              <li key={item.id} className="flex justify-between py-3 text-sm">
                <div>
                  <p className="font-medium">{item.productName}</p>
                  {item.variantName && (
                    <p className="text-muted-foreground">{item.variantName}</p>
                  )}
                  <p className="text-muted-foreground">Qty {item.quantity}</p>
                </div>
                <p>{formatPrice(item.price * item.quantity)}</p>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="font-medium">Shipping</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {order.shippingAddress.line1}
            {order.shippingAddress.line2 && `, ${order.shippingAddress.line2}`}
            <br />
            {order.shippingAddress.city}, {order.shippingAddress.state}{' '}
            {order.shippingAddress.postalCode}
            <br />
            {order.shippingAddress.country}
          </p>
        </div>

        <div className="flex justify-between border-t pt-4 text-lg font-semibold">
          <span>Total</span>
          <span>{formatPrice(order.total)}</span>
        </div>
      </div>
    </div>
  );
}

export default async function OrderPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <Suspense fallback={<TableSkeleton rows={5} />}>
        <OrderContent id={id} />
      </Suspense>
    </div>
  );
}
