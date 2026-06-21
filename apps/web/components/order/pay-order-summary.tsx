import type { OrderDetail } from '@storix/shared';
import { Separator } from '@storix/ui/separator';
import { OrderLineItems } from '@/components/order/order-line-items';
import { formatPrice } from '@/lib/utils';

interface PayOrderSummaryProps {
  order: OrderDetail;
}

export function PayOrderSummary({ order }: PayOrderSummaryProps) {
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Chi tiết đơn hàng</h2>
        <span className="text-sm text-muted-foreground">{itemCount} sản phẩm</span>
      </div>

      <OrderLineItems
        items={order.items}
        quantityBadge
        className="max-h-80 overflow-y-auto overscroll-contain pr-1"
      />

      <Separator />

      <dl className="space-y-2 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Tạm tính</dt>
          <dd className="font-medium">{formatPrice(order.subtotal)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Phí vận chuyển</dt>
          <dd className="font-medium text-emerald-600">Miễn phí</dd>
        </div>
      </dl>

      <Separator />

      <div className="flex items-baseline justify-between">
        <span className="text-base font-semibold">Tổng cộng</span>
        <span className="text-xl font-bold text-primary">{formatPrice(order.total)}</span>
      </div>
    </div>
  );
}
