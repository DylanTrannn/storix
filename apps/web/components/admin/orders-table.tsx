'use client';

import Link from 'next/link';
import { Button } from '@storix/ui/button';
import { AdminTable } from '@/components/admin/admin-table';
import { StatusBadge } from '@/components/admin/status-badge';

interface OrderRow {
  id: string;
  orderNumber: number;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  total: string;
  createdAt: string;
}

export function OrdersTable({ orders }: { orders: OrderRow[] }) {
  return (
    <AdminTable
      data={orders}
      getRowKey={(row) => row.id}
      emptyMessage="No orders yet."
      columns={[
        {
          key: 'order',
          header: 'Order',
          width: '15%',
          cellClassName: 'font-medium',
          render: (row) => `#${row.orderNumber}`,
        },
        {
          key: 'date',
          header: 'Date',
          width: '20%',
          cellClassName: 'text-muted-foreground',
          render: (row) => row.createdAt,
        },
        {
          key: 'status',
          header: 'Status',
          width: '15%',
          render: (row) => <StatusBadge status={row.status} />,
        },
        {
          key: 'payment',
          header: 'Payment',
          width: '15%',
          render: (row) =>
            row.paymentMethod === 'bank_transfer' ? (
              <StatusBadge status={row.paymentStatus} />
            ) : (
              <span className="text-xs text-muted-foreground">COD</span>
            ),
        },
        {
          key: 'total',
          header: 'Total',
          width: '15%',
          render: (row) => row.total,
        },
        {
          key: 'actions',
          header: 'Actions',
          align: 'right',
          width: '20%',
          render: (row) => (
            <Button variant="ghost" size="sm" asChild className="cursor-pointer">
              <Link href={`/admin/orders/${row.id}`}>View</Link>
            </Button>
          ),
        },
      ]}
    />
  );
}
