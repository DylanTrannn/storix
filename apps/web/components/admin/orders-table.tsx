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
      emptyMessage="Chưa có đơn hàng nào."
      columns={[
        {
          key: 'order',
          header: 'Đơn hàng',
          width: '15%',
          cellClassName: 'font-medium',
          render: (row) => `#${row.orderNumber}`,
        },
        {
          key: 'date',
          header: 'Ngày',
          width: '20%',
          cellClassName: 'text-muted-foreground',
          render: (row) => row.createdAt,
        },
        {
          key: 'status',
          header: 'Trạng thái',
          width: '15%',
          render: (row) => <StatusBadge status={row.status} />,
        },
        {
          key: 'payment',
          header: 'Thanh toán',
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
          header: 'Tổng',
          width: '15%',
          render: (row) => row.total,
        },
        {
          key: 'actions',
          header: 'Thao tác',
          align: 'right',
          width: '20%',
          render: (row) => (
            <Button variant="ghost" size="sm" asChild className="cursor-pointer">
              <Link href={`/admin/orders/${row.id}`}>Xem</Link>
            </Button>
          ),
        },
      ]}
    />
  );
}
