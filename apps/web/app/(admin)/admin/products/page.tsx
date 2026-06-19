import { getAdminProducts } from '@/lib/api';
import { ProductsPageContent } from '@/components/admin/products-page-content';

export default async function AdminProductsPage() {
  const response = await getAdminProducts({ page: 1, limit: 50 });

  return (
    <ProductsPageContent
      products={response.data.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        status: p.status,
      }))}
    />
  );
}
