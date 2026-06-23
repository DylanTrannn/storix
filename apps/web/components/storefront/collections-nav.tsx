'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useId, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { Collection } from '@storix/shared';
import {
  NAV_ALL,
  NAV_FEATURED_COLLECTIONS,
  collectionHref,
  getShopNavCollections,
  isShopNavActive,
} from '@/lib/storefront-nav';
import { cn } from '@/lib/utils';

interface CollectionsNavProps {
  collections: Collection[];
  className?: string;
}

function navLinkClass(active: boolean) {
  return cn(
    'inline-flex cursor-pointer px-3 py-2 text-sm font-medium transition-colors duration-200',
    active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
  );
}

function ShopDropdown({ collections }: { collections: Collection[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const shopCollections = getShopNavCollections(collections);
  const active = isShopNavActive(pathname, shopCollections);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        className={cn(navLinkClass(active), 'items-center gap-1')}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
      >
        Shop
        <ChevronDown
          className={cn('h-4 w-4 transition-transform duration-200', open && 'rotate-180')}
          aria-hidden
        />
      </button>

      {open && (
        <div
          id={menuId}
          role="menu"
          className="absolute left-0 top-full z-50 mt-1 min-w-44 rounded-lg border border-border bg-background py-1 shadow-lg"
        >
          {shopCollections.length === 0 ? (
            <p className="px-3 py-2 text-sm text-muted-foreground">No categories yet</p>
          ) : (
            shopCollections.map((collection) => {
              const href = collectionHref(collection.slug);
              const isActive = pathname === href;

              return (
                <Link
                  key={collection.id}
                  href={href}
                  role="menuitem"
                  className={cn(
                    'block px-3 py-2 text-sm transition-colors duration-200',
                    isActive
                      ? 'bg-muted text-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                  onClick={() => setOpen(false)}
                >
                  {collection.name}
                </Link>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

export function CollectionsNav({ collections, className }: CollectionsNavProps) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Shop collections"
      className={cn('flex items-center justify-center gap-1', className)}
    >
      <Link
        href={NAV_ALL.href}
        className={navLinkClass(pathname === NAV_ALL.href)}
      >
        {NAV_ALL.label}
      </Link>

      <ShopDropdown collections={collections} />

      {NAV_FEATURED_COLLECTIONS.map((item) => {
        const href = collectionHref(item.slug);

        return (
          <Link key={item.slug} href={href} className={navLinkClass(pathname === href)}>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
