import type { Metadata } from 'next';
import { Suspense } from 'react';
import { SearchPageContent } from '@/components/storefront/search-page-content';
import { ProductGridSkeleton } from '@/components/skeletons';
import { parsePageParam } from '@/lib/storefront-pagination';

export const metadata: Metadata = {
  title: 'Search',
  description: 'Search products and collections.',
};

interface PageProps {
  searchParams: Promise<{ q?: string; page?: string; collectionPage?: string }>;
}

function SearchFallback() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-10 h-32 animate-pulse rounded-xl bg-muted" />
      <ProductGridSkeleton />
    </div>
  );
}

export default async function SearchPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const q = params.q ?? '';
  const productPage = parsePageParam(params.page);
  const collectionPage = parsePageParam(params.collectionPage);

  return (
    <Suspense fallback={<SearchFallback />}>
      <SearchPageContent query={q} productPage={productPage} collectionPage={collectionPage} />
    </Suspense>
  );
}
