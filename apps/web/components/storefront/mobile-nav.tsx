'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { ChevronDown, LayoutDashboard, Menu, X } from 'lucide-react';
import type { Collection } from '@storix/shared';
import { Button } from '@storix/ui/button';
import {
  NAV_ALL,
  NAV_FEATURED_COLLECTIONS,
  collectionHref,
  getShopNavCollections,
  isShopNavActive,
} from '@/lib/storefront-nav';
import { cn } from '@/lib/utils';

interface MobileNavProps {
  collections: Collection[];
  isAdmin?: boolean;
}

export function MobileNav({ collections, isAdmin = false }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const pathname = usePathname();
  const shopCollections = getShopNavCollections(collections);
  const shopActive = isShopNavActive(pathname, shopCollections);

  function closeMenu() {
    setOpen(false);
    setShopOpen(false);
  }

  function linkClass(href: string, exact = false) {
    const active = exact ? pathname === href : pathname.startsWith(href);
    return cn(
      'block cursor-pointer rounded-lg px-4 py-3 text-sm font-medium transition-colors duration-200',
      active
        ? 'bg-primary/10 text-foreground'
        : 'text-muted-foreground hover:bg-muted hover:text-foreground',
    );
  }

  return (
    <div className="md:hidden">
      <Button
        variant="ghost"
        size="icon"
        aria-label={open ? 'Close menu' : 'Open menu'}
        onClick={() => setOpen(!open)}
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {open && (
        <>
          <div
            className="fixed inset-0 top-16 z-40 bg-stone-900/20 backdrop-blur-sm"
            onClick={closeMenu}
            aria-hidden
          />
          <nav className="fixed inset-x-4 top-20 z-50 max-h-[calc(100vh-6rem)] overflow-y-auto rounded-xl border border-border bg-card p-4 shadow-xl">
            <ul className="space-y-1">
              <li>
                <Link href={NAV_ALL.href} onClick={closeMenu} className={linkClass(NAV_ALL.href, true)}>
                  {NAV_ALL.label}
                </Link>
              </li>

              <li>
                <button
                  type="button"
                  className={cn(
                    'flex w-full cursor-pointer items-center justify-between rounded-lg px-4 py-3 text-sm font-medium transition-colors duration-200',
                    shopActive
                      ? 'bg-primary/10 text-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                  aria-expanded={shopOpen}
                  onClick={() => setShopOpen((value) => !value)}
                >
                  Shop
                  <ChevronDown
                    className={cn('h-4 w-4 transition-transform duration-200', shopOpen && 'rotate-180')}
                    aria-hidden
                  />
                </button>
                {shopOpen && (
                  <ul className="mt-1 space-y-1 pl-3">
                    {shopCollections.map((collection) => {
                      const href = collectionHref(collection.slug);

                      return (
                        <li key={collection.id}>
                          <Link href={href} onClick={closeMenu} className={linkClass(href, true)}>
                            {collection.name}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>

              {NAV_FEATURED_COLLECTIONS.map((item) => {
                const href = collectionHref(item.slug);

                return (
                  <li key={item.slug}>
                    <Link href={href} onClick={closeMenu} className={linkClass(href, true)}>
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>

            <ul className="mt-3 space-y-1 border-t border-border pt-3">
              <li>
                <Link href="/search" onClick={closeMenu} className={linkClass('/search')}>
                  Search
                </Link>
              </li>
              <li>
                <Link href="/account" onClick={closeMenu} className={linkClass('/account')}>
                  Tài khoản
                </Link>
              </li>
              {isAdmin && (
                <li>
                  <Link href="/admin" onClick={closeMenu} className={linkClass('/admin')}>
                    <span className="inline-flex items-center gap-2">
                      <LayoutDashboard className="h-4 w-4" />
                      Quản trị
                    </span>
                  </Link>
                </li>
              )}
            </ul>
          </nav>
        </>
      )}
    </div>
  );
}
