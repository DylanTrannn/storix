'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@storix/ui/button';
import { formatPrice } from '@/lib/utils';
import {
  removeStorefrontCartItem,
  updateStorefrontCartItem,
} from '@/lib/api/storefront';

export function CartItems({
  items,
}: {
  items: { id: string; name: string; quantity: number; price: number }[];
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function updateQuantity(id: string, quantity: number) {
    setLoadingId(id);
    try {
      await updateStorefrontCartItem(id, { quantity });
      await queryClient.invalidateQueries({ queryKey: ['cart'] });
      router.refresh();
    } finally {
      setLoadingId(null);
    }
  }

  async function removeItem(id: string) {
    setLoadingId(id);
    try {
      await removeStorefrontCartItem(id);
      await queryClient.invalidateQueries({ queryKey: ['cart'] });
      router.refresh();
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <ul className="divide-y">
      {items.map((item) => (
        <li key={item.id} className="flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium">{item.name}</p>
            <p className="text-sm text-muted-foreground">
              {formatPrice(item.price)} / sản phẩm
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={loadingId === item.id || item.quantity <= 1}
                onClick={() => updateQuantity(item.id, item.quantity - 1)}
              >
                −
              </Button>
              <span className="w-8 text-center text-sm">{item.quantity}</span>
              <Button
                variant="outline"
                size="sm"
                disabled={loadingId === item.id}
                onClick={() => updateQuantity(item.id, item.quantity + 1)}
              >
                +
              </Button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              disabled={loadingId === item.id}
              onClick={() => removeItem(item.id)}
            >
              Remove
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
