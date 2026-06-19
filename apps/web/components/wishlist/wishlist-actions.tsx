'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@storix/ui/button';
import { removeFromStorefrontWishlist } from '@/lib/api/storefront';

export function WishlistActions({ productId }: { productId: string }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handleRemove() {
    setIsLoading(true);
    try {
      await removeFromStorefrontWishlist(productId);
      router.refresh();
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Button variant="outline" size="sm" disabled={isLoading} onClick={handleRemove}>
      Remove
    </Button>
  );
}
