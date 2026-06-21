'use client';

import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { Input } from '@storix/ui/input';

interface SearchFormProps {
  defaultQuery?: string;
  autoFocus?: boolean;
}

export function SearchForm({ defaultQuery = '', autoFocus = false }: SearchFormProps) {
  const router = useRouter();

  return (
    <form
      className="relative max-w-xl"
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const query = String(formData.get('q') ?? '').trim();
        router.push(query ? `/search?q=${encodeURIComponent(query)}` : '/search');
      }}
    >
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        name="q"
        type="search"
        defaultValue={defaultQuery}
        autoFocus={autoFocus}
        placeholder="Search products and collections…"
        className="h-12 pl-10 text-base"
      />
    </form>
  );
}
