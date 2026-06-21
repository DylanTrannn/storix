'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown } from 'lucide-react';
import type { Collection } from '@storix/shared';
import { cn } from '@/lib/utils';

interface ShopNavMenuProps {
  collections: Collection[];
}

export function ShopNavMenu({ collections }: ShopNavMenuProps) {
  const pathname = usePathname();
  const shopActive = pathname.startsWith('/collections');

  return (
    <div className="group relative">
      <Link
        href="/collections/all"
        className={cn(
          'inline-flex cursor-pointer items-center gap-1 rounded-full px-4 py-2 text-sm font-medium transition-colors duration-200',
          shopActive
            ? 'bg-muted text-foreground'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground',
        )}
        aria-haspopup="menu"
      >
        Shop
        <ChevronDown className="h-3.5 w-3.5 opacity-60 transition-transform duration-200 group-hover:rotate-180 group-focus-within:rotate-180" />
      </Link>

      <div
        role="menu"
        className="invisible absolute left-0 top-full z-50 min-w-[28rem] max-w-[min(32rem,calc(100vw-2rem))] translate-y-1 rounded-xl border border-border bg-card p-2 opacity-0 shadow-lg transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100"
      >
        <Link
          href="/collections/all"
          role="menuitem"
          className={cn(
            'block rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200',
            pathname === '/collections/all'
              ? 'bg-primary/10 text-foreground'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground',
          )}
        >
          All products
        </Link>

        {collections.length > 0 && (
          <>
            <div className="my-1 border-t border-border" />
            <ul
              className={cn(
                'max-h-[min(20rem,70vh)] overflow-y-auto',
                collections.length > 6 && 'grid grid-cols-2 gap-x-2',
              )}
            >
              {collections.map((collection) => {
                const href = `/collections/${collection.slug}`;
                const active = pathname === href;

                return (
                  <li key={collection.id} className="break-inside-avoid">
                    <Link
                      href={href}
                      role="menuitem"
                      className={cn(
                        'block whitespace-nowrap rounded-lg px-3 py-2 text-sm transition-colors duration-200',
                        active
                          ? 'bg-primary/10 font-medium text-foreground'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                      )}
                    >
                      {collection.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
