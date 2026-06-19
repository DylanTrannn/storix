'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@storix/ui/button';
import { AdminTable } from '@/components/admin/admin-table';
import { AdminFormDialog } from '@/components/admin/form-dialog';
import { AdminPageHeader } from '@/components/admin/page-header';
import { StoreLocationForm } from '@/components/admin/store-location-form';

interface StoreRow {
  id: string;
  name: string;
  address: string;
}

interface StoresPageContentProps {
  stores: StoreRow[];
}

export function StoresPageContent({ stores }: StoresPageContentProps) {
  const router = useRouter();

  return (
    <>
      <AdminPageHeader
        label="Retail"
        title="Store locations"
        description="Manage physical store locations."
        action={
          <AdminFormDialog
            triggerLabel="Add location"
            title="Add store location"
            description="Add a new physical store for your customers to visit."
          >
            {({ onSuccess, onCancel }) => (
              <StoreLocationForm
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
        data={stores}
        getRowKey={(row) => row.id}
        emptyMessage="No store locations yet."
        columns={[
          {
            key: 'name',
            header: 'Name',
            width: '30%',
            cellClassName: 'font-medium',
            render: (row) => row.name,
          },
          {
            key: 'address',
            header: 'Address',
            width: '70%',
            cellClassName: 'text-muted-foreground',
            render: (row) => row.address,
          },
        ]}
      />
    </>
  );
}
