'use client';

import Image from 'next/image';
import type { Cart } from '@storix/shared';
import { Separator } from '@storix/ui/separator';
import { formatPrice, getVariantLabel } from '@/lib/utils';

interface CheckoutOrderSummaryProps {
  cart: Cart;
  paymentMethod: 'cash_on_delivery' | 'bank_transfer';
}

export function CheckoutOrderSummary({ cart, paymentMethod }: CheckoutOrderSummaryProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Đơn hàng</h2>
        <span className="text-sm text-muted-foreground">{cart.itemCount} sản phẩm</span>
      </div>

      <ul className="max-h-72 space-y-3 overflow-y-auto overscroll-contain pr-1">
        {cart.items.map((item) => {
          const variant = item.variant;
          const name = variant?.product.name ?? 'Sản phẩm';
          const price = variant?.price ?? 0;
          const imageUrl = variant?.imageUrl;
          const variantLabel = variant ? getVariantLabel(variant.options) : null;

          return (
            <li key={item.id} className="flex gap-3">
              <div className="relative size-16 shrink-0 overflow-hidden rounded-lg border bg-muted">
                {imageUrl ? (
                  <Image src={imageUrl} alt={name} fill className="object-cover" sizes="64px" />
                ) : (
                  <div className="flex size-full items-center justify-center text-xs text-muted-foreground">
                    —
                  </div>
                )}
                <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  {item.quantity}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-sm font-medium leading-snug">{name}</p>
                {variantLabel && (
                  <p className="mt-0.5 text-xs text-muted-foreground">{variantLabel}</p>
                )}
              </div>
              <p className="shrink-0 text-sm font-medium">{formatPrice(price * item.quantity)}</p>
            </li>
          );
        })}
      </ul>

      <Separator />

      <dl className="space-y-2 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Tạm tính</dt>
          <dd className="font-medium">{formatPrice(cart.subtotal)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Phí vận chuyển</dt>
          <dd className="font-medium text-emerald-600">Miễn phí</dd>
        </div>
        {paymentMethod === 'bank_transfer' && (
          <div className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
            Bạn sẽ nhận mã VietQR sau khi đặt hàng. Đơn được giữ khi thanh toán được xác nhận.
          </div>
        )}
      </dl>

      <Separator />

      <div className="flex items-baseline justify-between">
        <span className="text-base font-semibold">Tổng cộng</span>
        <span className="text-xl font-bold text-primary">{formatPrice(cart.subtotal)}</span>
      </div>
    </div>
  );
}
