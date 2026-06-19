import { Suspense } from 'react';
import { CartDrawer } from '@/components/cart/cart-drawer';
import { StorefrontFooter } from '@/components/storefront/footer';
import { StorefrontHeader } from '@/components/storefront/header';

export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <StorefrontHeader />
      <main id="main-content" className="flex-1">{children}</main>
      <StorefrontFooter />
      <Suspense fallback={null}>
        <CartDrawer />
      </Suspense>
    </div>
  );
}
