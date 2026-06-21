'use client';

import Link from 'next/link';
import { Button } from '@storix/ui/button';
import { AdminTable } from '@/components/admin/admin-table';

interface CustomerRow {
  id: string;
  name: string;
  email: string;
}

export function CustomersTable({ customers }: { customers: CustomerRow[] }) {
  return (
    <AdminTable
      data={customers}
      getRowKey={(row) => row.id}
      emptyMessage="Chưa có khách hàng nào."
      columns={[
        {
          key: 'name',
          header: 'Tên',
          width: '35%',
          cellClassName: 'font-medium',
          render: (row) => row.name,
        },
        {
          key: 'email',
          header: 'Email',
          width: '45%',
          cellClassName: 'truncate text-muted-foreground',
          render: (row) => row.email,
        },
        {
          key: 'actions',
          header: 'Thao tác',
          align: 'right',
          width: '20%',
          render: (row) => (
            <Button variant="ghost" size="sm" asChild className="cursor-pointer">
              <Link href={`/admin/customers/${row.id}`}>Xem</Link>
            </Button>
          ),
        },
      ]}
    />
  );
}
