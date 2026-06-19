import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { Button } from '@storix/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@storix/ui/card';
import { getCurrentUser, getOrders } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { ProfileForm } from '@/components/account/profile-form';
import { TableSkeleton } from '@/components/skeletons';

async function AccountContent() {
  const user = await getCurrentUser();
  if (!user) redirect('/login?redirect=/account');

  let orders;
  try {
    orders = await getOrders({ page: 1, limit: 5 });
  } catch {
    orders = { data: [], meta: { page: 1, limit: 5, total: 0, totalPages: 0 } };
  }

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <ProfileForm
              defaultValues={{
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
              }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent orders</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/orders">View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {orders.data.length === 0 ? (
              <p className="text-sm text-muted-foreground">No orders yet.</p>
            ) : (
              <ul className="divide-y">
                {orders.data.map((order) => (
                  <li key={order.id} className="flex items-center justify-between py-3">
                    <div>
                      <Link href={`/orders/${order.id}`} className="font-medium hover:underline">
                        Order #{order.id.slice(0, 8)}
                      </Link>
                      <p className="text-sm capitalize text-muted-foreground">{order.status}</p>
                    </div>
                    <span className="text-sm font-medium">{formatPrice(order.total)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="h-fit">
        <CardHeader>
          <CardTitle>Quick links</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2">
          <Button variant="outline" asChild className="justify-start">
            <Link href="/wishlist">Wishlist</Link>
          </Button>
          <Button variant="outline" asChild className="justify-start">
            <Link href="/cart">Cart</Link>
          </Button>
          {user.role === 'admin' && (
            <Button variant="outline" asChild className="justify-start">
              <Link href="/admin">Admin panel</Link>
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function AccountPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-[family-name:var(--font-display)] text-4xl font-semibold">Account</h1>
      <Suspense fallback={<TableSkeleton />}>
        <div className="mt-8">
          <AccountContent />
        </div>
      </Suspense>
    </div>
  );
}
