import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@storix/ui/button';
import { cn } from '@/lib/utils';

interface StorefrontPaginationProps {
  page: number;
  totalPages: number;
  buildHref: (page: number) => string;
  className?: string;
}

export function StorefrontPagination({
  page,
  totalPages,
  buildHref,
  className,
}: StorefrontPaginationProps) {
  if (totalPages <= 1) return null;

  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  return (
    <nav
      aria-label="Pagination"
      className={cn('flex items-center justify-between gap-4 pt-8', className)}
    >
      <p className="text-sm text-muted-foreground">
        Page {page} of {totalPages}
      </p>
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
    </nav>
  );
}
