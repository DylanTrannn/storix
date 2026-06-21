'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@storix/ui/button';
import { formatAdminDateTime, getPaymentStatusLabel } from '@/lib/admin/labels';

interface PaymentConfirmFormProps {
  orderId: string;
  paymentStatus: string;
  transferReference: string | null | undefined;
  customerMarkedPaidAt: Date | null | undefined;
}

export function PaymentConfirmForm({
  orderId,
  paymentStatus,
  transferReference,
  customerMarkedPaidAt,
}: PaymentConfirmFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canConfirm =
    paymentStatus === 'pending' || paymentStatus === 'awaiting_review';

  async function handleConfirm(confirmed: boolean) {
    setIsLoading(true);
    setError(null);
    try {
      const { confirmOrderPaymentAction } = await import('@/lib/actions/admin');
      await confirmOrderPaymentAction(orderId, confirmed);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể cập nhật thanh toán');
    } finally {
      setIsLoading(false);
    }
  }

  if (!canConfirm) {
    return (
      <div className="rounded-lg border p-4 text-sm">
        <h2 className="font-medium">Thanh toán</h2>
        <p className="mt-2 text-muted-foreground">{getPaymentStatusLabel(paymentStatus)}</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border p-4 space-y-4">
      <h2 className="font-medium">Chuyển khoản ngân hàng</h2>
      {transferReference && (
        <div className="text-sm">
          <p className="text-muted-foreground">Nội dung chuyển khoản</p>
          <p className="mt-1 font-mono font-medium">{transferReference}</p>
        </div>
      )}
      {customerMarkedPaidAt && (
        <p className="text-sm text-muted-foreground">
          Khách đã xác nhận thanh toán: {formatAdminDateTime(customerMarkedPaidAt)}
        </p>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button onClick={() => handleConfirm(true)} disabled={isLoading} className="flex-1">
          {isLoading ? 'Đang xác nhận…' : 'Xác nhận thanh toán'}
        </Button>
        <Button
          variant="outline"
          onClick={() => handleConfirm(false)}
          disabled={isLoading}
          className="flex-1"
        >
          Từ chối
        </Button>
      </div>
    </div>
  );
}
