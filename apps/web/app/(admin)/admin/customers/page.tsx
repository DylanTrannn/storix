import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { getAdminCustomers } from '@/lib/api';
import { AdminPageHeader } from '@/components/admin/page-header';
import { TableSkeleton } from '@/components/skeletons';

const CustomersTable = dynamic(
  () => import('@/components/admin/customers-table').then((m) => m.CustomersTable),
  { loading: () => <TableSkeleton rows={8} /> },
);

async function CustomersList() {
  const response = await getAdminCustomers({ page: 1, limit: 50 });
  return (
    <CustomersTable
      customers={response.data.map((c) => ({
        id: c.id,
        name: `${c.firstName} ${c.lastName}`,
        email: c.email,
      }))}
    />
  );
}

export default function AdminCustomersPage() {
  return (
    <div>
      <AdminPageHeader
        label="Khách hàng"
        title="Khách hàng"
        description="Xem khách hàng đã đăng ký và lịch sử đơn hàng."
      />
      <Suspense fallback={<TableSkeleton rows={8} />}>
        <CustomersList />
      </Suspense>
    </div>
  );
}
