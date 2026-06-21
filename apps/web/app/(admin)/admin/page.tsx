import { Suspense } from 'react';
import Link from 'next/link';
import {
  DollarSign,
  Package,
  ShoppingBag,
  Users,
  ArrowUpRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@storix/ui/card';
import { Badge } from '@storix/ui/badge';
import { getDashboardStats } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { getOrderStatusLabel } from '@/lib/admin/labels';
import { TableSkeleton } from '@/components/skeletons';

const metricIcons = {
  orders: ShoppingBag,
  revenue: DollarSign,
  products: Package,
  customers: Users,
};

async function DashboardStats() {
  let stats;
  try {
    stats = await getDashboardStats();
  } catch {
    stats = {
      totalOrders: 0,
      totalRevenue: 0,
      totalProducts: 0,
      totalCustomers: 0,
      recentOrders: [],
    };
  }

  const metrics = [
    { key: 'orders' as const, label: 'Tổng đơn hàng', value: stats.totalOrders.toString() },
    { key: 'revenue' as const, label: 'Doanh thu', value: formatPrice(stats.totalRevenue) },
    { key: 'products' as const, label: 'Sản phẩm', value: stats.totalProducts.toString() },
    { key: 'customers' as const, label: 'Khách hàng', value: stats.totalCustomers.toString() },
  ];

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metricIcons[metric.key];
          return (
            <Card
              key={metric.label}
              className="overflow-hidden border-border shadow-sm transition-shadow duration-200 hover:shadow-md"
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {metric.label}
                </CardTitle>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="heading-display text-3xl">{metric.value}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="mt-8 border-border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="heading-display text-xl">Đơn hàng gần đây</CardTitle>
          <Link
            href="/admin/orders"
            className="flex cursor-pointer items-center gap-1 text-sm font-medium text-primary transition-colors duration-200 hover:text-primary/80"
          >
            Xem tất cả
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </CardHeader>
        <CardContent>
          {stats.recentOrders.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Chưa có đơn hàng nào.</p>
          ) : (
            <ul className="divide-y divide-border">
              {stats.recentOrders.map((order) => (
                <li key={order.id} className="flex items-center justify-between py-4">
                  <Link
                    href={`/admin/orders/${order.id}`}
                    className="cursor-pointer font-mono text-sm hover:text-primary"
                  >
                    #{order.id.slice(0, 8)}
                  </Link>
                  <Badge variant="secondary">
                    {getOrderStatusLabel(order.status)}
                  </Badge>
                  <span className="font-semibold">{formatPrice(order.total)}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </>
  );
}

export default function AdminDashboardPage() {
  return (
    <div>
      <div className="mb-8">
        <p className="section-label">Tổng quan</p>
        <h1 className="heading-display mt-1 text-3xl">Bảng điều khiển</h1>
        <p className="mt-2 text-muted-foreground">
          Theo dõi hiệu suất cửa hàng của bạn.
        </p>
      </div>
      <Suspense fallback={<TableSkeleton rows={4} />}>
        <DashboardStats />
      </Suspense>
    </div>
  );
}
