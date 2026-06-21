'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { OrderStatus } from '@storix/shared';
import { Button } from '@storix/ui/button';
import { Label } from '@storix/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@storix/ui/select';
import { getOrderStatusLabel } from '@/lib/admin/labels';
import { updateOrderStatusAction } from '@/lib/actions/admin';

const STATUSES: OrderStatus[] = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'completed',
  'cancelled',
];

interface OrderStatusFormProps {
  orderId: string;
  currentStatus: OrderStatus;
}

export function OrderStatusForm({ orderId, currentStatus }: OrderStatusFormProps) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [isLoading, setIsLoading] = useState(false);

  async function handleUpdate() {
    setIsLoading(true);
    try {
      await updateOrderStatusAction(orderId, status);
      router.refresh();
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="rounded-lg border p-4 space-y-4">
      <h2 className="font-medium">Cập nhật trạng thái</h2>
      <div className="space-y-2">
        <Label htmlFor="status">Trạng thái</Label>
        <Select value={status} onValueChange={(v) => setStatus(v as OrderStatus)}>
          <SelectTrigger id="status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {getOrderStatusLabel(s)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button onClick={handleUpdate} disabled={isLoading || status === currentStatus}>
        {isLoading ? 'Đang cập nhật…' : 'Cập nhật trạng thái'}
      </Button>
    </div>
  );
}
