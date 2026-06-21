'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ImageIcon } from 'lucide-react';
import { Button } from '@storix/ui/button';
import { AdminPagination } from '@/components/admin/admin-pagination';
import { AdminSearchBar } from '@/components/admin/admin-search-bar';
import { AdminTable } from '@/components/admin/admin-table';
import { AdminFormDialog } from '@/components/admin/form-dialog';
import { AdminPageHeader } from '@/components/admin/page-header';
import { CollectionForm } from '@/components/admin/collection-form';

interface CollectionRow {
  id: string;
  name: string;
  slug: string;
  imageUrl?: string | null;
}

function CollectionThumbnail({ name, imageUrl }: { name: string; imageUrl?: string | null }) {
  return (
    <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-md border border-border bg-muted">
      {imageUrl ? (
        <Image src={imageUrl} alt={name} fill className="object-cover" sizes="44px" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-muted-foreground">
          <ImageIcon className="h-4 w-4" aria-hidden />
        </div>
      )}
    </div>
  );
}

interface CollectionsPageContentProps {
  collections: CollectionRow[];
  page: number;
  totalPages: number;
  total: number;
  search: string;
}

export function CollectionsPageContent({
  collections,
  page,
  totalPages,
  total,
  search,
}: CollectionsPageContentProps) {
  const router = useRouter();

  return (
    <>
      <AdminPageHeader
        label="Danh mục"
        title="Bộ sưu tập"
        description="Nhóm sản phẩm thành các bộ sưu tập."
        action={
          <AdminFormDialog
            triggerLabel="Thêm bộ sưu tập"
            title="Thêm bộ sưu tập"
            description="Tạo bộ sưu tập mới cho cửa hàng."
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

      <div className="mb-4">
        <AdminSearchBar search={search} placeholder="Tìm bộ sưu tập theo tên…" />
      </div>

      <AdminTable
        data={collections}
        getRowKey={(row) => row.id}
        emptyMessage={search ? 'Không tìm thấy bộ sưu tập phù hợp.' : 'Chưa có bộ sưu tập nào.'}
        columns={[
          {
            key: 'thumbnail',
            header: '',
            width: '56px',
            render: (row) => <CollectionThumbnail name={row.name} imageUrl={row.imageUrl} />,
          },
          {
            key: 'name',
            header: 'Tên',
            width: '35%',
            cellClassName: 'font-medium',
            render: (row) => row.name,
          },
          {
            key: 'slug',
            header: 'Slug',
            width: '35%',
            cellClassName: 'truncate text-muted-foreground',
            render: (row) => row.slug,
          },
          {
            key: 'actions',
            header: 'Thao tác',
            align: 'right',
            width: '15%',
            render: (row) => (
              <Button variant="ghost" size="sm" asChild className="cursor-pointer">
                <Link href={`/admin/collections/${row.id}`}>Sửa</Link>
              </Button>
            ),
          },
        ]}
      />

      <AdminPagination
        page={page}
        totalPages={totalPages}
        total={total}
        search={search || undefined}
        itemLabel="bộ sưu tập"
        className="mt-4"
      />
    </>
  );
}
