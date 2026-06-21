import Link from 'next/link';
import type { Order } from '@storix/shared';
import { Button } from '@storix/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@storix/ui/table';
import { formatPrice } from '@/lib/utils';
import {
  ORDER_STATUS_BADGE,
  ORDER_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_BADGE,
  PAYMENT_STATUS_LABELS,
} from '@/lib/order-labels';
import { cn } from '@/lib/utils';

function StatusPill({ label, className }: { label: string; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex w-fit shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium',
        className ?? 'bg-muted text-muted-foreground',
      )}
    >
      {label}
    </span>
  );
}

interface RecentOrdersTableProps {
  orders: Order[];
}

export function RecentOrdersTable({ orders }: RecentOrdersTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Mã đơn</TableHead>
            <TableHead className="hidden sm:table-cell">Ngày đặt</TableHead>
            <TableHead>Trạng thái</TableHead>
            <TableHead className="hidden md:table-cell">Thanh toán</TableHead>
            <TableHead className="text-right">Tổng</TableHead>
            <TableHead className="text-right">
              <span className="sr-only">Chi tiết</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => {
            const paymentLabel =
              order.paymentMethod === 'cash_on_delivery'
                ? PAYMENT_METHOD_LABELS.cash_on_delivery
                : (PAYMENT_STATUS_LABELS[order.paymentStatus] ?? order.paymentStatus);

            const paymentBadgeClass =
              order.paymentMethod === 'cash_on_delivery'
                ? 'bg-stone-100 text-stone-600'
                : (PAYMENT_STATUS_BADGE[order.paymentStatus] ?? 'bg-muted text-muted-foreground');

            return (
              <TableRow key={order.id}>
                <TableCell className="font-medium">
                  <Link href={`/orders/${order.id}`} className="hover:text-primary hover:underline">
                    #{order.orderNumber}
                  </Link>
                  <p className="mt-0.5 text-xs text-muted-foreground sm:hidden">
                    {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                  </p>
                </TableCell>
                <TableCell className="hidden text-muted-foreground sm:table-cell">
                  {new Date(order.createdAt).toLocaleDateString('vi-VN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </TableCell>
                <TableCell>
                  <StatusPill
                    label={ORDER_STATUS_LABELS[order.status] ?? order.status}
                    className={ORDER_STATUS_BADGE[order.status]}
                  />
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <StatusPill label={paymentLabel} className={paymentBadgeClass} />
                </TableCell>
                <TableCell className="text-right font-medium">{formatPrice(order.total)}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/orders/${order.id}`}>Xem</Link>
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
