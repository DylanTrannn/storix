import { getAdminCollections } from '@/lib/api';
import { parsePageParam } from '@/lib/storefront-pagination';
import { CollectionsPageContent } from '@/components/admin/collections-page-content';

const PAGE_SIZE = 20;

interface PageProps {
  searchParams: Promise<{ page?: string; search?: string }>;
}

export default async function AdminCollectionsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = parsePageParam(params.page);
  const search = params.search?.trim() || undefined;

  const response = await getAdminCollections({ page, limit: PAGE_SIZE, search });

  return (
    <CollectionsPageContent
      collections={response.data.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        imageUrl: c.imageUrl ?? null,
      }))}
      page={response.meta.page}
      totalPages={response.meta.totalPages}
      total={response.meta.total}
      search={search ?? ''}
    />
  );
}
