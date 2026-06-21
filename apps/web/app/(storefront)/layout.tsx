import { Suspense } from 'react';
import { CartDrawer } from '@/components/cart/cart-drawer';
import { StorefrontFooter } from '@/components/storefront/footer';
import { StorefrontHeader } from '@/components/storefront/header';
import { getCurrentUser, getNavCollections } from '@/lib/api';

export default async function StorefrontLayout({ children }: { children: React.ReactNode }) {
  const [collections, user] = await Promise.all([getNavCollections(), getCurrentUser()]);
  const isAdmin = user?.role === 'admin';

  return (
    <div className="flex min-h-screen flex-col">
      <StorefrontHeader collections={collections} isAdmin={isAdmin} />
      <main id="main-content" className="flex-1">{children}</main>
      <StorefrontFooter collections={collections} isAdmin={isAdmin} />
      <Suspense fallback={null}>
        <CartDrawer />
      </Suspense>
    </div>
  );
}
