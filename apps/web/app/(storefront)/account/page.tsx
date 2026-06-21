import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { Button } from '@storix/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@storix/ui/card';
import { getCurrentUser, getOrders } from '@/lib/api';
import { ProfileForm } from '@/components/account/profile-form';
import { RecentOrdersTable } from '@/components/account/recent-orders-table';
import { TableSkeleton } from '@/components/skeletons';

async function AccountContent() {
  const user = await getCurrentUser();
  if (!user) redirect('/login?redirect=/account');

  let orders;
  try {
    orders = await getOrders({ page: 1, limit: 10 });
  } catch {
    orders = { data: [], meta: { page: 1, limit: 10, total: 0, totalPages: 0 } };
  }

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="space-y-8 lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Thông tin cá nhân</CardTitle>
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
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Đơn hàng gần đây</CardTitle>
              {orders.meta.total > 0 && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {orders.meta.total} đơn hàng
                </p>
              )}
            </div>
            {orders.data.length > 0 && (
              <Button variant="ghost" size="sm" asChild>
                <Link href="/orders">Xem tất cả</Link>
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {orders.data.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm text-muted-foreground">Bạn chưa có đơn hàng nào.</p>
                <Button variant="link" asChild className="mt-2">
                  <Link href="/collections/all">Mua sắm ngay</Link>
                </Button>
              </div>
            ) : (
              <RecentOrdersTable orders={orders.data} />
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="h-fit">
        <CardHeader>
          <CardTitle>Liên kết nhanh</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2">
          <Button variant="outline" asChild className="justify-start">
            <Link href="/wishlist">Yêu thích</Link>
          </Button>
          <Button variant="outline" asChild className="justify-start">
            <Link href="/cart">Giỏ hàng</Link>
          </Button>
          {user.role === 'admin' && (
            <Button variant="outline" asChild className="justify-start">
              <Link href="/admin">Quản trị</Link>
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
      <h1 className="font-[family-name:var(--font-display)] text-4xl font-semibold">Tài khoản</h1>
      <Suspense fallback={<TableSkeleton />}>
        <div className="mt-8">
          <AccountContent />
        </div>
      </Suspense>
    </div>
  );
}
