import Link from 'next/link';
import { Suspense } from 'react';
import { Button } from '@storix/ui/button';
import { getWishlist } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { WishlistActions } from '@/components/wishlist/wishlist-actions';
import { TableSkeleton } from '@/components/skeletons';

async function WishlistContent() {
  let wishlist;
  try {
    wishlist = await getWishlist();
  } catch {
    return <p className="py-12 text-center text-muted-foreground">Sign in to view your wishlist.</p>;
  }

  if (wishlist.items.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-lg font-medium">Your wishlist is empty</p>
        <Button asChild className="mt-6">
          <Link href="/collections/all">Browse products</Link>
        </Button>
      </div>
    );
  }

  return (
    <ul className="divide-y">
      {wishlist.items.map((item) => (
        <li key={item.id} className="flex items-center justify-between gap-4 py-6">
          <div>
            <Link
              href={`/products/${item.product?.slug ?? item.productId}`}
              className="font-medium hover:underline"
            >
              {item.product?.name ?? 'Product'}
            </Link>
            {item.product?.minPrice !== undefined && (
              <p className="text-sm text-muted-foreground">
                {formatPrice(item.product.minPrice)}
              </p>
            )}
          </div>
          <WishlistActions productId={item.productId} />
        </li>
      ))}
    </ul>
  );
}

export default function WishlistPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-[family-name:var(--font-display)] text-4xl font-semibold">Wishlist</h1>
      <Suspense fallback={<TableSkeleton rows={4} />}>
        <div className="mt-8">
          <WishlistContent />
        </div>
      </Suspense>
    </div>
  );
}
