import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { Button } from '@storix/ui/button';
import { getCurrentUser, getOrders } from '@/lib/api';
import { RecentOrdersTable } from '@/components/account/recent-orders-table';
import { TableSkeleton } from '@/components/skeletons';

interface PageProps {
  searchParams: Promise<{ page?: string }>;
}

async function OrdersContent({ page }: { page: number }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login?redirect=/orders');

  let orders;
  try {
    orders = await getOrders({ page, limit: 20 });
  } catch {
    orders = { data: [], meta: { page: 1, limit: 20, total: 0, totalPages: 0 } };
  }

  return (
    <div className="space-y-6">
      {orders.data.length === 0 ? (
        <div className="rounded-xl border bg-card py-16 text-center">
          <p className="text-muted-foreground">Bạn chưa có đơn hàng nào.</p>
          <Button variant="link" asChild className="mt-2">
            <Link href="/collections/all">Mua sắm ngay</Link>
          </Button>
        </div>
      ) : (
        <>
          <RecentOrdersTable orders={orders.data} />
          {orders.meta.totalPages > 1 && (
            <div className="flex items-center justify-between text-sm">
              <p className="text-muted-foreground">
                Trang {orders.meta.page} / {orders.meta.totalPages}
              </p>
              <div className="flex gap-2">
                {page > 1 && (
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/orders?page=${page - 1}`}>Trước</Link>
                  </Button>
                )}
                {page < orders.meta.totalPages && (
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/orders?page=${page + 1}`}>Sau</Link>
                  </Button>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default async function OrdersPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold">
            Đơn hàng của tôi
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Theo dõi trạng thái đơn hàng</p>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/account">← Tài khoản</Link>
        </Button>
      </div>
      <Suspense fallback={<TableSkeleton rows={8} />}>
        <OrdersContent page={page} />
      </Suspense>
    </div>
  );
}
