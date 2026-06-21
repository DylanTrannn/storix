import Link from 'next/link';
import { searchCatalog } from '@/lib/api/search';
import { buildQueryHref } from '@/lib/storefront-pagination';
import { SearchForm } from '@/components/storefront/search-form';
import { StorefrontPagination } from '@/components/storefront/pagination';
import { CollectionGrid, ProductGrid } from '@/components/storefront/product-card';

interface SearchPageContentProps {
  query: string;
  productPage: number;
  collectionPage: number;
}

export async function SearchPageContent({
  query,
  productPage,
  collectionPage,
}: SearchPageContentProps) {
  const results = await searchCatalog(query, { productPage, collectionPage });

  const hasQuery = results.query.length > 0;
  const totalResults = results.productsMeta.total + results.collectionsMeta.total;
  const baseParams = { q: results.query, page: productPage, collectionPage };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-10 border-b border-border pb-8">
        <p className="section-label">Search</p>
        <h1 className="heading-display mt-2 text-4xl sm:text-5xl">
          {hasQuery ? `Results for “${results.query}”` : 'Search the catalog'}
        </h1>
        <div className="mt-6">
          <SearchForm defaultQuery={results.query} />
        </div>
        {hasQuery && (
          <p className="mt-4 text-sm text-muted-foreground">
            {totalResults === 0
              ? 'No matches found.'
              : `${totalResults} result${totalResults === 1 ? '' : 's'} found`}
          </p>
        )}
      </div>

      {!hasQuery && (
        <p className="text-muted-foreground">
          Enter a keyword to find products and collections.
        </p>
      )}

      {hasQuery && totalResults === 0 && (
        <div className="rounded-xl border border-dashed border-border bg-muted/20 px-6 py-16 text-center">
          <p className="text-lg font-medium text-foreground">Nothing matched your search</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Try a different keyword or browse{' '}
            <Link href="/collections/all" className="font-medium text-primary hover:underline">
              all products
            </Link>
            .
          </p>
        </div>
      )}

      {results.collections.length > 0 && (
        <section className="mb-16">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                Collections
              </p>
              <h2 className="heading-display mt-2 text-2xl sm:text-3xl">
                {results.collectionsMeta.total} collection
                {results.collectionsMeta.total === 1 ? '' : 's'}
              </h2>
            </div>
          </div>
          <CollectionGrid collections={results.collections} />
          <StorefrontPagination
            page={results.collectionsMeta.page}
            totalPages={results.collectionsMeta.totalPages}
            buildHref={(page) =>
              buildQueryHref('/search', baseParams, { collectionPage: page })
            }
          />
        </section>
      )}

      {results.products.length > 0 && (
        <section>
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                Products
              </p>
              <h2 className="heading-display mt-2 text-2xl sm:text-3xl">
                {results.productsMeta.total} product
                {results.productsMeta.total === 1 ? '' : 's'}
              </h2>
            </div>
          </div>
          <ProductGrid products={results.products} />
          <StorefrontPagination
            page={results.productsMeta.page}
            totalPages={results.productsMeta.totalPages}
            buildHref={(page) => buildQueryHref('/search', baseParams, { page })}
          />
        </section>
      )}
    </div>
  );
}
