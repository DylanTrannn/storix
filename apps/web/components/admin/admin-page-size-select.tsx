'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ADMIN_PAGE_SIZES, buildQueryHref } from '@/lib/storefront-pagination';
import { cn } from '@/lib/utils';

interface AdminPageSizeSelectProps {
  limit: number;
  search?: string;
  status?: string;
  className?: string;
}

export function AdminPageSizeSelect({
  limit,
  search,
  status,
  className,
}: AdminPageSizeSelectProps) {
  const pathname = usePathname();

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span className="text-sm text-muted-foreground whitespace-nowrap">Hiển thị</span>
      <div className="inline-flex rounded-md border border-border bg-background p-0.5">
        {ADMIN_PAGE_SIZES.map((size) => {
          const isActive = limit === size;
          const href = buildQueryHref(pathname, {
            search,
            status,
            limit: size === 10 ? undefined : size,
            page: undefined,
          });

          return isActive ? (
            <span
              key={size}
              className="inline-flex min-w-[2.25rem] items-center justify-center rounded px-2 py-1 text-sm font-medium bg-primary text-primary-foreground"
              aria-current="page"
            >
              {size}
            </span>
          ) : (
            <Link
              key={size}
              href={href}
              className="inline-flex min-w-[2.25rem] items-center justify-center rounded px-2 py-1 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {size}
            </Link>
          );
        })}
      </div>
      <span className="text-sm text-muted-foreground whitespace-nowrap">/ trang</span>
    </div>
  );
}
