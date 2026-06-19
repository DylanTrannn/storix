import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@storix/ui/card';
import { getAdminCustomer } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { TableSkeleton } from '@/components/skeletons';

interface PageProps {
  params: Promise<{ id: string }>;
}

async function CustomerDetail({ id }: { id: string }) {
  let customer;
  try {
    customer = await getAdminCustomer(id);
  } catch {
    notFound();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>
            {customer.firstName} {customer.lastName}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p>{customer.email}</p>
          <p className="mt-2 capitalize">Role: {customer.role}</p>
          <p className="mt-2">
            Joined {new Date(customer.createdAt).toLocaleDateString()}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Order history</CardTitle>
        </CardHeader>
        <CardContent>
          {!customer.orders || customer.orders.length === 0 ? (
            <p className="text-sm text-muted-foreground">No orders.</p>
          ) : (
            <ul className="divide-y text-sm">
              {customer.orders.map((order) => (
                <li key={order.id} className="flex justify-between py-2">
                  <Link href={`/admin/orders/${order.id}`} className="hover:underline">
                    #{order.id.slice(0, 8)}
                  </Link>
                  <span>{formatPrice(order.total)}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default async function AdminCustomerPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <div>
      <h1 className="text-2xl font-semibold">Customer details</h1>
      <Suspense fallback={<TableSkeleton rows={4} />}>
        <div className="mt-6">
          <CustomerDetail id={id} />
        </div>
      </Suspense>
    </div>
  );
}
