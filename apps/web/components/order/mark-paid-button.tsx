'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@storix/ui/button';

interface MarkPaidButtonProps {
  orderId: string;
  disabled?: boolean;
}

export function MarkPaidButton({ orderId, disabled }: MarkPaidButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleMarkPaid() {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/orders/${orderId}/mark-paid`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!response.ok) {
        const data = (await response.json()) as { message?: string };
        throw new Error(data.message ?? 'Không thể gửi xác nhận thanh toán');
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        size="lg"
        className="w-full"
        onClick={handleMarkPaid}
        disabled={disabled || isLoading}
      >
        {isLoading ? 'Đang gửi…' : 'Tôi đã chuyển khoản'}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
