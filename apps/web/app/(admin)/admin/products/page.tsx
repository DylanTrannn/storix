import { getAdminProducts } from '@/lib/api';
import { parsePageParam } from '@/lib/storefront-pagination';
import { ProductsPageContent } from '@/components/admin/products-page-content';

const PAGE_SIZE = 20;

interface PageProps {
  searchParams: Promise<{ page?: string; search?: string }>;
}

export default async function AdminProductsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = parsePageParam(params.page);
  const search = params.search?.trim() || undefined;

  const response = await getAdminProducts({ page, limit: PAGE_SIZE, search });

  return (
    <ProductsPageContent
      products={response.data.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        status: p.status,
        imageUrl: p.images?.[0]?.url ?? null,
        minPrice: p.minPrice ?? null,
      }))}
      page={response.meta.page}
      totalPages={response.meta.totalPages}
      total={response.meta.total}
      search={search ?? ''}
    />
  );
}
