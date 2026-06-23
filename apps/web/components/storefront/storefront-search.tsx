'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FolderOpen, Loader2, Search, X } from 'lucide-react';
import type { Collection, ProductPublic } from '@storix/shared';
import { Button } from '@storix/ui/button';
import { Input } from '@storix/ui/input';
import { fetchSearchSuggestions } from '@/lib/api/search-client';
import { formatPrice } from '@/lib/utils';

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
      className="flex items-start gap-2.5 rounded-md px-2 py-2 transition-colors duration-200 hover:bg-muted/70"
      title={collection.name}
    >
      <div className="relative mt-0.5 h-9 w-9 shrink-0 overflow-hidden rounded-md bg-muted">
        {collection.imageUrl ? (
          <Image
            src={collection.imageUrl}
            alt=""
            fill
            className="object-cover"
            sizes="36px"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </div>
        )}
      </div>
      <p className="min-w-0 flex-1 break-words text-sm font-medium leading-snug text-foreground line-clamp-2">
        {collection.name}
      </p>
    </Link>
  );
}

function SuggestionColumn({
  label,
  emptyMessage,
  children,
}: {
  label: string;
  emptyMessage: string;
  children: ReactNode;
}) {
  const isEmpty = children == null;

  return (
    <section className="flex min-h-0 min-w-0 flex-col" aria-label={label}>
      <p className="mb-1 shrink-0 px-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {isEmpty ? (
          <p className="px-2 py-3 text-sm text-muted-foreground">{emptyMessage}</p>
        ) : (
          children
        )}
      </div>
    </section>
  );
}

function ProductSuggestion({ product }: { product: ProductPublic }) {
  const image = product.images?.[0];

  return (
    <Link
      href={`/products/${product.slug}`}
      className="flex items-start gap-2.5 rounded-md px-2 py-2 transition-colors duration-200 hover:bg-muted/70"
      title={product.name}
    >
      <div className="relative mt-0.5 h-9 w-9 shrink-0 overflow-hidden rounded-md bg-muted">
        {image ? (
          <Image src={image.url} alt="" fill className="object-cover" sizes="36px" />
        ) : (
          <div className="flex h-full items-center justify-center text-[10px] text-muted-foreground">
            —
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="break-words text-sm font-medium leading-snug text-foreground line-clamp-2">
          {product.name}
        </p>
        {product.minPrice != null && (
          <p className="mt-0.5 text-xs font-semibold text-primary">{formatPrice(product.minPrice)}</p>
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
        <div className="fixed inset-x-0 top-16 z-50 border-b border-border bg-background px-4 py-4 shadow-lg sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-[min(42rem,calc(100vw-2rem))] sm:rounded-xl sm:border sm:p-3 sm:shadow-xl">
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
              type="text"
              role="searchbox"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search products and collections…"
              autoComplete="off"
              className="h-11 border-0 bg-muted pr-10 pl-10 shadow-none focus-visible:ring-1 focus-visible:ring-border"
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
            <div className="mt-3 border-t border-border/40 pt-3">
              {isFetching && (
                <div className="flex items-center gap-2 px-2 py-4 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Searching…
                </div>
              )}

              {!isFetching && isError && (
                <p className="px-2 py-4 text-sm text-destructive">Search failed. Try again.</p>
              )}

              {!isFetching && !isError && !hasResults && canSearch && (
                <div>
                  <p className="px-2 py-3 text-sm text-muted-foreground">
                    No quick matches for &ldquo;{debouncedQuery.trim()}&rdquo;
                  </p>
                  <button
                    type="button"
                    onClick={goToSearchPage}
                    className="mt-1 w-full cursor-pointer rounded-md px-2 py-2 text-left text-sm font-medium text-primary transition-colors hover:bg-primary/10"
                  >
                    Search for &ldquo;{query.trim()}&rdquo;
                  </button>
                </div>
              )}

              {!isFetching && !isError && hasResults && (
                <>
                  <div className="grid max-h-[min(22rem,55vh)] grid-cols-[minmax(0,1fr)_minmax(0,2fr)] divide-x divide-border/50">
                    <div className="min-w-0 pr-4">
                      <SuggestionColumn
                        label="Collections"
                        emptyMessage="No matching collections"
                      >
                        {collections.length > 0 ? (
                          <ul>
                            {collections.map((collection) => (
                              <li key={collection.id} onClick={closeSearch}>
                                <CollectionSuggestion collection={collection} />
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </SuggestionColumn>
                    </div>

                    <div className="min-w-0 pl-4">
                      <SuggestionColumn label="Products" emptyMessage="No matching products">
                        {products.length > 0 ? (
                          <ul>
                            {products.map((product) => (
                              <li key={product.id} onClick={closeSearch}>
                                <ProductSuggestion product={product} />
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </SuggestionColumn>
                    </div>
                  </div>

                  <div className="mt-3 border-t border-border/50 pt-3">
                    <button
                      type="button"
                      onClick={goToSearchPage}
                      className="w-full cursor-pointer rounded-md px-2 py-2 text-left text-sm font-medium text-primary transition-colors hover:bg-primary/10"
                    >
                      View all results for &ldquo;{query.trim()}&rdquo;
                    </button>
                  </div>
                </>
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
