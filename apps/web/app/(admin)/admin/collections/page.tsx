import { getAdminCollections } from '@/lib/api';
import { CollectionsPageContent } from '@/components/admin/collections-page-content';

export default async function AdminCollectionsPage() {
  const response = await getAdminCollections({ page: 1, limit: 50 });

  return (
    <CollectionsPageContent
      collections={response.data.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
      }))}
    />
  );
}
