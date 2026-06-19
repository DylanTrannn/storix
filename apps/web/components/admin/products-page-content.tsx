'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@storix/ui/button';
import { AdminTable } from '@/components/admin/admin-table';
import { AdminFormDialog } from '@/components/admin/form-dialog';
import { AdminPageHeader } from '@/components/admin/page-header';
import { ProductForm } from '@/components/admin/product-form';
import { StatusBadge } from '@/components/admin/status-badge';

interface ProductRow {
  id: string;
  name: string;
  slug: string;
  status: string;
}

interface ProductsPageContentProps {
  products: ProductRow[];
}

export function ProductsPageContent({ products }: ProductsPageContentProps) {
  const router = useRouter();

  return (
    <>
      <AdminPageHeader
        label="Catalog"
        title="Products"
        description="Manage your product catalog."
        action={
          <AdminFormDialog
            triggerLabel="Add product"
            title="Add product"
            description="Create a new product in your catalog."
          >
            {({ onSuccess, onCancel }) => (
              <ProductForm
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
        data={products}
        getRowKey={(row) => row.id}
        emptyMessage="No products yet."
        columns={[
          {
            key: 'name',
            header: 'Name',
            width: '35%',
            cellClassName: 'font-medium',
            render: (row) => row.name,
          },
          {
            key: 'slug',
            header: 'Slug',
            width: '30%',
            cellClassName: 'truncate text-muted-foreground',
            render: (row) => row.slug,
          },
          {
            key: 'status',
            header: 'Status',
            width: '15%',
            render: (row) => <StatusBadge status={row.status} />,
          },
          {
            key: 'actions',
            header: 'Actions',
            align: 'right',
            width: '20%',
            render: (row) => (
              <Button variant="ghost" size="sm" asChild className="cursor-pointer">
                <Link href={`/admin/products/${row.id}`}>Edit</Link>
              </Button>
            ),
          },
        ]}
      />
    </>
  );
}
