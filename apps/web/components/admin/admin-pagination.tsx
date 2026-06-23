'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@storix/ui/button';
import { AdminPageSizeSelect } from '@/components/admin/admin-page-size-select';
import { buildQueryHref } from '@/lib/storefront-pagination';
import { cn } from '@/lib/utils';

interface AdminPaginationProps {
  page: number;
  limit?: number;
  totalPages: number;
  total: number;
  search?: string;
  status?: string;
  itemLabel?: string;
  showPageSize?: boolean;
  className?: string;
}

export function AdminPagination({
  page,
  limit = 10,
  totalPages,
  total,
  search,
  status,
  itemLabel = 'mục',
  showPageSize = false,
  className,
}: AdminPaginationProps) {
  const pathname = usePathname();

  if (totalPages <= 1 && total === 0) return null;

  const buildHref = (nextPage: number) =>
    buildQueryHref(pathname, {
      search,
      status,
      limit: limit === 10 ? undefined : limit,
      page: nextPage,
    });

  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  return (
    <nav
      aria-label="Phân trang"
      className={cn('flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between', className)}
    >
      <div className="flex flex-wrap items-center gap-4">
        {showPageSize && (
          <AdminPageSizeSelect limit={limit} search={search} status={status} />
        )}
        <p className="text-sm text-muted-foreground">
          {total} {itemLabel}
          {totalPages > 1 ? ` · Trang ${page}/${totalPages}` : ''}
        </p>
      </div>
      {totalPages > 1 && (
        <div className="flex gap-2">
          {hasPrev ? (
            <Button variant="outline" size="sm" asChild>
              <Link href={buildHref(page - 1)} className="gap-1">
                <ChevronLeft className="h-4 w-4" />
                Trước
              </Link>
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled className="gap-1">
              <ChevronLeft className="h-4 w-4" />
              Trước
            </Button>
          )}
          {hasNext ? (
            <Button variant="outline" size="sm" asChild>
              <Link href={buildHref(page + 1)} className="gap-1">
                Sau
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled className="gap-1">
              Sau
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}
    </nav>
  );
}
