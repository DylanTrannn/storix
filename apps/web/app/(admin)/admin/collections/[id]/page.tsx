import { notFound } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { getAdminCollection } from '@/lib/api';
import { TableSkeleton } from '@/components/skeletons';

const CollectionForm = dynamic(
  () => import('@/components/admin/collection-form').then((m) => m.CollectionForm),
  { loading: () => <TableSkeleton rows={5} /> },
);

interface PageProps {
  params: Promise<{ id: string }>;
}

async function EditCollection({ id }: { id: string }) {
  let collection;
  try {
    collection = await getAdminCollection(id);
  } catch {
    notFound();
  }

  return (
    <CollectionForm
      collectionId={collection.id}
      defaultValues={{
        name: collection.name,
        slug: collection.slug,
        description: collection.description ?? undefined,
        imageUrl: collection.imageUrl ?? undefined,
      }}
    />
  );
}

export default async function EditCollectionPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <div>
      <h1 className="text-2xl font-semibold">Edit collection</h1>
      <div className="mt-6 max-w-xl">
        <Suspense fallback={<TableSkeleton rows={5} />}>
          <EditCollection id={id} />
        </Suspense>
      </div>
    </div>
  );
}
