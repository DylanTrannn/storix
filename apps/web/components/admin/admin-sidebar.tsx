'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  FolderOpen,
  ShoppingBag,
  Users,
  MapPin,
  LogOut,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems: { href: string; label: string; icon: LucideIcon }[] = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/collections', label: 'Collections', icon: FolderOpen },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { href: '/admin/customers', label: 'Customers', icon: Users },
  { href: '/admin/stores', label: 'Stores', icon: MapPin },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-stone-800 bg-accent text-accent-foreground lg:flex">
      <div className="flex h-16 items-center border-b border-stone-800 px-6">
        <Link
          href="/admin"
          className="font-[family-name:var(--font-display)] text-lg font-semibold tracking-tight"
        >
          Storix
          <span className="ml-1.5 text-xs font-normal text-primary">Admin</span>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 p-4" aria-label="Admin navigation">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== '/admin' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'text-stone-400 hover:bg-stone-800 hover:text-white',
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-stone-800 p-4">
        <Link
          href="/"
          className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-stone-400 transition-colors duration-200 hover:bg-stone-800 hover:text-white"
        >
          <LogOut className="h-4 w-4" />
          Back to storefront
        </Link>
      </div>
    </aside>
  );
}
