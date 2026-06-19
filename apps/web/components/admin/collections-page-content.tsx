'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@storix/ui/button';
import { AdminTable } from '@/components/admin/admin-table';
import { AdminFormDialog } from '@/components/admin/form-dialog';
import { AdminPageHeader } from '@/components/admin/page-header';
import { CollectionForm } from '@/components/admin/collection-form';

interface CollectionRow {
  id: string;
  name: string;
  slug: string;
}

interface CollectionsPageContentProps {
  collections: CollectionRow[];
}

export function CollectionsPageContent({ collections }: CollectionsPageContentProps) {
  const router = useRouter();

  return (
    <>
      <AdminPageHeader
        label="Catalog"
        title="Collections"
        description="Organize products into collections."
        action={
          <AdminFormDialog
            triggerLabel="Add collection"
            title="Add collection"
            description="Create a new collection for your storefront."
          >
            {({ onSuccess, onCancel }) => (
              <CollectionForm
                onSuccess={() => {
                  onSuccess();
                  router.refresh();
                }}
                onCancel={onCancel}
              />
            )}
          </AdminFormDialog>
        }
      />

      <AdminTable
        data={collections}
        getRowKey={(row) => row.id}
        emptyMessage="No collections yet."
        columns={[
          {
            key: 'name',
            header: 'Name',
            width: '40%',
            cellClassName: 'font-medium',
            render: (row) => row.name,
          },
          {
            key: 'slug',
            header: 'Slug',
            width: '40%',
            cellClassName: 'truncate text-muted-foreground',
            render: (row) => row.slug,
          },
          {
            key: 'actions',
            header: 'Actions',
            align: 'right',
            width: '20%',
            render: (row) => (
              <Button variant="ghost" size="sm" asChild className="cursor-pointer">
                <Link href={`/admin/collections/${row.id}`}>Edit</Link>
              </Button>
            ),
          },
        ]}
      />
    </>
  );
}
