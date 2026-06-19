import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { getAdminOrders } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
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
        status: o.status,
        total: formatPrice(o.total),
        createdAt: new Date(o.createdAt).toLocaleDateString(),
      }))}
    />
  );
}

export default function AdminOrdersPage() {
  return (
    <div>
      <AdminPageHeader
        label="Commerce"
        title="Orders"
        description="View and manage customer orders."
      />
      <Suspense fallback={<TableSkeleton rows={8} />}>
        <OrdersList />
      </Suspense>
    </div>
  );
}
