'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { Input } from '@storix/ui/input';
import { buildQueryHref } from '@/lib/storefront-pagination';

interface AdminSearchBarProps {
  search: string;
  placeholder?: string;
}

export function AdminSearchBar({
  search,
  placeholder = 'Search…',
}: AdminSearchBarProps) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <form
      className="relative w-full max-w-sm"
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const nextSearch = String(formData.get('search') ?? '').trim();
        router.push(
          buildQueryHref(pathname, {
            search: nextSearch || undefined,
            page: undefined,
          }),
        );
      }}
    >
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        name="search"
        type="search"
        defaultValue={search}
        placeholder={placeholder}
        className="h-9 pl-9"
      />
    </form>
  );
}
