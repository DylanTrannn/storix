import { Suspense } from 'react';
import { CartPageShell } from '@/components/cart/cart-page-content';
import { TableSkeleton } from '@/components/skeletons';

export default function CartPage() {
  return (
    <Suspense fallback={
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
        <TableSkeleton rows={3} />
      </div>
    }>
      <CartPageShell />
    </Suspense>
  );
}
