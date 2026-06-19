import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { getCollectionBySlug } from '@/lib/api';
import { ProductGrid } from '@/components/storefront/product-card';
import { CollectionSort } from '@/components/collection/collection-sort';
import { ProductGridSkeleton } from '@/components/skeletons';

export const revalidate = 60;

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string; sort?: string; direction?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  if (slug === 'all') {
    return {
      title: 'All products',
      description: 'Browse our full collection of curated goods.',
    };
  }
  try {
    const collection = await getCollectionBySlug(slug, { page: 1, limit: 1 });
    return {
      title: collection.name,
      description: collection.description ?? undefined,
      openGraph: {
        title: collection.name,
        description: collection.description ?? undefined,
        images: collection.imageUrl ? [{ url: collection.imageUrl }] : undefined,
      },
    };
  } catch {
    return { title: 'Collection not found' };
  }
}

async function CollectionContent({
  slug,
  page,
  sort,
  direction,
}: {
  slug: string;
  page: number;
  sort?: string;
  direction?: string;
}) {
  let data;
  try {
    data = await getCollectionBySlug(slug, { page, limit: 20, sort, direction });
  } catch {
    notFound();
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-10 flex flex-col gap-4 border-b border-border pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="section-label">Collection</p>
          <h1 className="heading-display mt-2 text-4xl sm:text-5xl">{data.name}</h1>
          {data.description && (
            <p className="mt-3 max-w-2xl text-muted-foreground">{data.description}</p>
          )}
        </div>
        <Suspense fallback={null}>
          <CollectionSort />
        </Suspense>
      </div>
      <ProductGrid products={data.products.data} />
      {data.products.meta.totalPages > 1 && (
        <p className="mt-8 text-center text-sm text-muted-foreground">
          Page {data.products.meta.page} of {data.products.meta.totalPages}
        </p>
      )}
    </div>
  );
}

export default async function CollectionPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { page: pageParam, sort, direction } = await searchParams;
  const page = Number(pageParam) || 1;

  return (
    <Suspense fallback={
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <ProductGridSkeleton />
      </div>
    }>
      <CollectionContent slug={slug} page={page} sort={sort} direction={direction} />
    </Suspense>
  );
}
