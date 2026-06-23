'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@storix/ui/button';
import { addToStorefrontWishlist, removeFromStorefrontWishlist } from '@/lib/api/storefront';

interface WishlistButtonProps {
  productId: string;
}

export function WishlistButton({ productId }: WishlistButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleToggle() {
    setIsLoading(true);
    setError(null);
    try {
      if (added) {
        await removeFromStorefrontWishlist(productId);
        setAdded(false);
      } else {
        await addToStorefrontWishlist({ productId });
        setAdded(true);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Request failed';
      if (message.toLowerCase().includes('sign in')) {
        router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
        return;
      }
      setError('Could not update wishlist. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button
        variant="outline"
        className="h-12 w-full text-base"
        size="lg"
        disabled={isLoading}
        onClick={handleToggle}
      >
        {added ? 'Remove from wishlist' : 'Add to wishlist'}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
