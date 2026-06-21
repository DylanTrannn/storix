import type { OrderDetail } from '@storix/shared';
import Link from 'next/link';
import { Button } from '@storix/ui/button';
import { PAYMENT_STATUS_BADGE, PAYMENT_STATUS_LABELS } from '@/lib/order-labels';

interface OrderStatusBannerProps {
  order: OrderDetail;
}

export function OrderStatusBanner({ order }: OrderStatusBannerProps) {
  if (order.paymentMethod === 'cash_on_delivery') {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
        <p className="font-medium text-emerald-900">Đặt hàng thành công</p>
        <p className="mt-1 text-sm text-emerald-800">
          Thanh toán khi nhận hàng. Chúng tôi sẽ xác nhận đơn hàng trong thời gian sớm nhất.
        </p>
      </div>
    );
  }

  const paymentInfo = {
    label: PAYMENT_STATUS_LABELS[order.paymentStatus] ?? order.paymentStatus,
    className: PAYMENT_STATUS_BADGE[order.paymentStatus] ?? 'bg-muted text-muted-foreground',
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${paymentInfo.className}`}
        >
          {paymentInfo.label}
        </span>
        {order.paymentStatus === 'pending' && (
          <Button size="sm" asChild>
            <Link href={`/orders/${order.id}/pay`}>Thanh toán ngay</Link>
          </Button>
        )}
      </div>

      {order.paymentStatus === 'pending' && order.transferReference && (
        <p className="text-sm text-muted-foreground">
          Chuyển đúng số tiền với nội dung{' '}
          <span className="font-medium text-foreground">{order.transferReference}</span>
        </p>
      )}
    </div>
  );
}
