'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { ChevronDown, Menu, X } from 'lucide-react';
import type { Collection } from '@storix/shared';
import { Button } from '@storix/ui/button';
import { cn } from '@/lib/utils';

interface MobileNavProps {
  collections: Collection[];
}

export function MobileNav({ collections }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(true);
  const pathname = usePathname();

  function closeMenu() {
    setOpen(false);
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
                <button
                  type="button"
                  onClick={() => setShopOpen(!shopOpen)}
                  className="flex w-full cursor-pointer items-center justify-between rounded-lg px-4 py-3 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground"
                  aria-expanded={shopOpen}
                >
                  Shop
                  <ChevronDown
                    className={cn('h-4 w-4 transition-transform duration-200', shopOpen && 'rotate-180')}
                  />
                </button>
                {shopOpen && (
                  <ul className="mt-1 space-y-0.5 pl-2">
                    <li>
                      <Link
                        href="/collections/all"
                        onClick={closeMenu}
                        className={linkClass('/collections/all', true)}
                      >
                        All products
                      </Link>
                    </li>
                    {collections.map((collection) => (
                      <li key={collection.id}>
                        <Link
                          href={`/collections/${collection.slug}`}
                          onClick={closeMenu}
                          className={linkClass(`/collections/${collection.slug}`, true)}
                        >
                          {collection.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
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
            </ul>
          </nav>
        </>
      )}
    </div>
  );
}
