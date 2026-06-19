'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ShoppingCart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getStorefrontCart } from '@/lib/api/storefront';
import { useCartDrawer } from '@/lib/stores/cart-drawer';

const iconButtonClass =
  'inline-flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full text-foreground transition-colors duration-200 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

export function CartDrawerTrigger() {
  const open = useCartDrawer((s) => s.open);
  const { data: cart } = useQuery({
    queryKey: ['cart'],
    queryFn: () => getStorefrontCart(),
    staleTime: 30 * 1000,
  });

  const itemCount = cart?.itemCount ?? 0;
  const badgeLabel = itemCount > 99 ? '99+' : String(itemCount);

  return (
    <button
      type="button"
      onClick={open}
      aria-label={itemCount > 0 ? `Open cart, ${itemCount} items` : 'Open cart'}
      className={cn(iconButtonClass, 'relative')}
    >
      <ShoppingCart className="h-5 w-5" />
      {itemCount > 0 && (
        <span
          className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold leading-none text-primary-foreground shadow-sm"
          aria-hidden
        >
          {badgeLabel}
        </span>
      )}
    </button>
  );
}

export function HeaderIconLink({
  href,
  label,
  children,
  className,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link href={href} aria-label={label} className={cn(iconButtonClass, className)}>
      {children}
    </Link>
  );
}
