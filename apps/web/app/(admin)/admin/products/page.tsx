import { getAdminProducts } from '@/lib/api';
import { parseAdminPageSizeParam, parsePageParam } from '@/lib/storefront-pagination';
import { ProductsPageContent } from '@/components/admin/products-page-content';

interface PageProps {
  searchParams: Promise<{ page?: string; search?: string; status?: string; limit?: string }>;
}

export default async function AdminProductsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = parsePageParam(params.page);
  const limit = parseAdminPageSizeParam(params.limit);
  const search = params.search?.trim() || undefined;
  const statusParam = params.status?.trim();
  const status =
    statusParam === 'draft' || statusParam === 'active' || statusParam === 'archived'
      ? statusParam
      : undefined;

  const response = await getAdminProducts({
    page,
    limit,
    search,
    status,
    sort: 'createdAt',
    direction: 'desc',
  });

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
      limit={limit}
      totalPages={response.meta.totalPages}
      total={response.meta.total}
      search={search ?? ''}
      status={status ?? ''}
    />
  );
}
