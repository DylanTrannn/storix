import Link from 'next/link';
import { Heart } from 'lucide-react';
import { CartDrawerTrigger, HeaderIconLink } from '@/components/cart/cart-drawer-trigger';
import { MobileNav } from '@/components/storefront/mobile-nav';

const navLinks = [
  { href: '/collections/all', label: 'Shop' },
  { href: '/stores', label: 'Stores' },
  { href: '/account', label: 'Account' },
];

export function StorefrontHeader() {
  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Skip to main content
      </a>
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="heading-display text-xl tracking-tight transition-opacity duration-200 hover:opacity-80 sm:text-2xl"
          >
            Storix
          </Link>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="cursor-pointer rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-0.5">
            <HeaderIconLink href="/wishlist" label="Wishlist">
              <Heart className="h-5 w-5" />
            </HeaderIconLink>
            <CartDrawerTrigger />
            <MobileNav />
          </div>
        </div>
      </header>
    </>
  );
}
