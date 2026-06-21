'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@storix/ui/button';
import { buildQueryHref } from '@/lib/storefront-pagination';
import { cn } from '@/lib/utils';

interface AdminPaginationProps {
  page: number;
  totalPages: number;
  total: number;
  search?: string;
  itemLabel?: string;
  className?: string;
}

export function AdminPagination({
  page,
  totalPages,
  total,
  search,
  itemLabel = 'items',
  className,
}: AdminPaginationProps) {
  const pathname = usePathname();

  if (totalPages <= 1 && total === 0) return null;

  const buildHref = (nextPage: number) =>
    buildQueryHref(pathname, { search, page: nextPage });

  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  return (
    <nav
      aria-label="Pagination"
      className={cn('flex items-center justify-between gap-4 border-t border-border pt-4', className)}
    >
      <p className="text-sm text-muted-foreground">
        {total} {itemLabel}
        {totalPages > 1 ? ` · Page ${page} of ${totalPages}` : ''}
      </p>
      {totalPages > 1 && (
        <div className="flex gap-2">
          {hasPrev ? (
            <Button variant="outline" size="sm" asChild>
              <Link href={buildHref(page - 1)} className="gap-1">
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Link>
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled className="gap-1">
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
          )}
          {hasNext ? (
            <Button variant="outline" size="sm" asChild>
              <Link href={buildHref(page + 1)} className="gap-1">
                Next
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled className="gap-1">
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}
    </nav>
  );
}
