'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useId, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FolderOpen, Loader2, Search, X } from 'lucide-react';
import type { Collection, ProductPublic } from '@storix/shared';
import { Button } from '@storix/ui/button';
import { Input } from '@storix/ui/input';
import { fetchSearchSuggestions } from '@/lib/api/search-client';
import { cn, formatPrice } from '@/lib/utils';

const SUGGESTION_LIMIT = 5;
const MIN_QUERY_LENGTH = 1;
const DEBOUNCE_MS = 250;

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

function CollectionSuggestion({ collection }: { collection: Collection }) {
  return (
    <Link
      href={`/collections/${collection.slug}`}
      className="flex items-center gap-3 rounded-lg px-3 py-2 transition-colors duration-200 hover:bg-muted"
    >
      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-muted">
        {collection.imageUrl ? (
          <Image
            src={collection.imageUrl}
            alt=""
            fill
            className="object-cover"
            sizes="40px"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </div>
        )}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-foreground">{collection.name}</p>
        <p className="text-xs text-muted-foreground">Collection</p>
      </div>
    </Link>
  );
}

function ProductSuggestion({ product }: { product: ProductPublic }) {
  const image = product.images?.[0];

  return (
    <Link
      href={`/products/${product.slug}`}
      className="flex items-center gap-3 rounded-lg px-3 py-2 transition-colors duration-200 hover:bg-muted"
    >
      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-muted">
        {image ? (
          <Image src={image.url} alt="" fill className="object-cover" sizes="40px" />
        ) : (
          <div className="flex h-full items-center justify-center text-[10px] text-muted-foreground">
            —
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{product.name}</p>
        {product.minPrice != null && (
          <p className="text-xs font-semibold text-primary">{formatPrice(product.minPrice)}</p>
        )}
      </div>
    </Link>
  );
}

export function StorefrontSearch() {
  const router = useRouter();
  const inputId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, DEBOUNCE_MS);

  const canSearch = debouncedQuery.trim().length >= MIN_QUERY_LENGTH;

  const { data, isFetching, isError } = useQuery({
    queryKey: ['search-suggestions', debouncedQuery],
    queryFn: () => fetchSearchSuggestions(debouncedQuery, SUGGESTION_LIMIT),
    enabled: open && canSearch,
    staleTime: 30_000,
  });

  const collections = data?.collections ?? [];
  const products = data?.products ?? [];
  const hasResults = collections.length > 0 || products.length > 0;
  const showPanel = open && query.trim().length > 0;

  function closeSearch() {
    setOpen(false);
    setQuery('');
  }

  function openSearch() {
    setOpen(true);
  }

  function goToSearchPage() {
    const trimmed = query.trim();
    closeSearch();
    router.push(trimmed ? `/search?q=${encodeURIComponent(trimmed)}` : '/search');
  }

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        closeSearch();
      }
    }

    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        closeSearch();
      }
    }

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('mousedown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('mousedown', onPointerDown);
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    }
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Search"
        aria-expanded={open}
        aria-controls={inputId}
        className="h-10 w-10 shrink-0 cursor-pointer rounded-full"
        onClick={() => (open ? closeSearch() : openSearch())}
      >
        <Search className="h-5 w-5" />
      </Button>

      {open && (
        <div className="fixed inset-x-0 top-16 z-50 border-b border-border bg-background/95 px-4 py-4 shadow-lg backdrop-blur-md sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-[min(32rem,calc(100vw-2rem))] sm:rounded-xl sm:border sm:p-3">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              goToSearchPage();
            }}
            className="relative"
          >
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={inputRef}
              id={inputId}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search products and collections…"
              autoComplete="off"
              className="h-11 pr-10 pl-10"
            />
            {query && (
              <button
                type="button"
                aria-label="Clear search"
                className="absolute top-1/2 right-2 flex h-7 w-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                onClick={() => setQuery('')}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </form>

          {showPanel && (
            <div className="mt-3 max-h-[min(24rem,60vh)] overflow-y-auto rounded-lg border border-border bg-card">
              {isFetching && (
                <div className="flex items-center gap-2 px-4 py-6 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Searching…
                </div>
              )}

              {!isFetching && isError && (
                <p className="px-4 py-6 text-sm text-destructive">Search failed. Try again.</p>
              )}

              {!isFetching && !isError && !hasResults && canSearch && (
                <div className="p-2">
                  <p className="px-3 py-4 text-sm text-muted-foreground">
                    No quick matches for &ldquo;{debouncedQuery.trim()}&rdquo;
                  </p>
                  <div className="border-t border-border pt-2">
                    <button
                      type="button"
                      onClick={goToSearchPage}
                      className="w-full cursor-pointer rounded-lg px-3 py-2 text-left text-sm font-medium text-primary transition-colors hover:bg-primary/10"
                    >
                      Search for &ldquo;{query.trim()}&rdquo;
                    </button>
                  </div>
                </div>
              )}

              {!isFetching && !isError && hasResults && (
                <div className="p-2">
                  {collections.length > 0 && (
                    <section aria-label="Matching collections">
                      <p className="px-3 py-2 text-xs font-semibold uppercase tracking-widest text-primary">
                        Collections
                      </p>
                      <ul className="space-y-0.5">
                        {collections.map((collection) => (
                          <li key={collection.id} onClick={closeSearch}>
                            <CollectionSuggestion collection={collection} />
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}

                  {collections.length > 0 && products.length > 0 && (
                    <div className="my-2 border-t border-border" />
                  )}

                  {products.length > 0 && (
                    <section aria-label="Matching products">
                      <p className="px-3 py-2 text-xs font-semibold uppercase tracking-widest text-primary">
                        Products
                      </p>
                      <ul className="space-y-0.5">
                        {products.map((product) => (
                          <li key={product.id} onClick={closeSearch}>
                            <ProductSuggestion product={product} />
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}

                  <div className="mt-2 border-t border-border p-2">
                    <button
                      type="button"
                      onClick={goToSearchPage}
                      className={cn(
                        'w-full cursor-pointer rounded-lg px-3 py-2 text-left text-sm font-medium text-primary transition-colors hover:bg-primary/10',
                      )}
                    >
                      View all results for &ldquo;{query.trim()}&rdquo;
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {open && !query.trim() && (
            <p className="mt-2 hidden text-xs text-muted-foreground sm:block">
              Press Enter to search the full catalog
            </p>
          )}
        </div>
      )}
    </div>
  );
}
