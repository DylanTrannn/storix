import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { getAdminOrders } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { formatAdminDate } from '@/lib/admin/labels';
import { AdminPageHeader } from '@/components/admin/page-header';
import { TableSkeleton } from '@/components/skeletons';

const OrdersTable = dynamic(
  () => import('@/components/admin/orders-table').then((m) => m.OrdersTable),
  { loading: () => <TableSkeleton rows={8} /> },
);

async function OrdersList() {
  const response = await getAdminOrders({ page: 1, limit: 50 });
  return (
    <OrdersTable
      orders={response.data.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        paymentStatus: o.paymentStatus,
        paymentMethod: o.paymentMethod,
        total: formatPrice(o.total),
        createdAt: formatAdminDate(o.createdAt),
      }))}
    />
  );
}

export default function AdminOrdersPage() {
  return (
    <div>
      <AdminPageHeader
        label="Kinh doanh"
        title="Đơn hàng"
        description="Xem và quản lý đơn hàng của khách."
      />
      <Suspense fallback={<TableSkeleton rows={8} />}>
        <OrdersList />
      </Suspense>
    </div>
  );
}
