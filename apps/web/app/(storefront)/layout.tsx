import { Suspense } from 'react';
import { CartDrawer } from '@/components/cart/cart-drawer';
import { ProductQuickView } from '@/components/product/product-quick-view';
import { StorefrontFooter } from '@/components/storefront/footer';
import { StorefrontHeader } from '@/components/storefront/header';
import { getCurrentUser, getNavCollections } from '@/lib/api';

export default async function StorefrontLayout({ children }: { children: React.ReactNode }) {
  let collections: Awaited<ReturnType<typeof getNavCollections>> = [];
  let user: Awaited<ReturnType<typeof getCurrentUser>> = null;

  try {
    [collections, user] = await Promise.all([getNavCollections(), getCurrentUser()]);
  } catch {
    // API may still be starting in dev (ECONNREFUSED) — render with empty nav data.
  }

  const isAdmin = user?.role === 'admin';

  return (
    <div className="flex min-h-screen flex-col">
      <StorefrontHeader collections={collections} isAdmin={isAdmin} />
      <main id="main-content" className="flex-1">{children}</main>
      <StorefrontFooter collections={collections} isAdmin={isAdmin} />
      <Suspense fallback={null}>
        <CartDrawer />
        <ProductQuickView />
      </Suspense>
    </div>
  );
}
