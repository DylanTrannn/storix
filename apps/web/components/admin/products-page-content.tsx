'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ImageIcon, Pencil, Trash2 } from 'lucide-react';
import type { ProductDetail, ProductStatus } from '@storix/shared';
import { Button } from '@storix/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@storix/ui/select';
import { AdminPagination } from '@/components/admin/admin-pagination';
import { AdminSearchBar } from '@/components/admin/admin-search-bar';
import { AdminTable } from '@/components/admin/admin-table';
import { AdminConfirmDialog } from '@/components/admin/confirm-dialog';
import { AdminFormDialog } from '@/components/admin/form-dialog';
import { AdminPageHeader } from '@/components/admin/page-header';
import { adminIconButtonClass } from '@/components/admin/admin-button-styles';
import { ProductForm } from '@/components/admin/product-form';
import { ProductStatusSelect } from '@/components/admin/product-status-select';
import { formatPrice } from '@/lib/utils';
import { buildQueryHref } from '@/lib/storefront-pagination';
import {
  deleteProductAction,
  getAdminProductAction,
} from '@/lib/actions/admin';

interface ProductRow {
  id: string;
  name: string;
  slug: string;
  status: ProductStatus;
  imageUrl?: string | null;
  minPrice?: number | null;
}

interface ProductsPageContentProps {
  products: ProductRow[];
  page: number;
  limit: number;
  totalPages: number;
  total: number;
  search: string;
  status: string;
}

function ProductThumbnail({ name, imageUrl }: { name: string; imageUrl?: string | null }) {
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

function ProductNameLink({ name, slug }: Pick<ProductRow, 'name' | 'slug'>) {
  return (
    <Link
      href={`/products/${slug}`}
      target="_blank"
      rel="noopener noreferrer"
      className="font-medium text-foreground underline-offset-4 hover:text-primary hover:underline"
      title="Xem trang sản phẩm (bản nháp/lưu trữ chỉ hiển thị với quản trị viên)"
    >
      {name}
    </Link>
  );
}

export function ProductsPageContent({
  products,
  page,
  limit,
  totalPages,
  total,
  search,
  status,
}: ProductsPageContentProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [editOpen, setEditOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<ProductDetail | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ProductRow | null>(null);
  const [visibleProducts, setVisibleProducts] = useState(products);

  useEffect(() => {
    setVisibleProducts(products);
  }, [products]);

  async function openEdit(productId: string) {
    setEditOpen(true);
    setEditLoading(true);
    setEditProduct(null);
    try {
      const product = await getAdminProductAction(productId);
      setEditProduct(product);
    } catch {
      setEditOpen(false);
    } finally {
      setEditLoading(false);
    }
  }

  function closeEdit() {
    setEditOpen(false);
    setEditProduct(null);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    const deleted = deleteTarget;
    setDeleteTarget(null);
    setVisibleProducts((current) => current.filter((product) => product.id !== deleted.id));
    try {
      await deleteProductAction(deleted.id);
    } finally {
      router.refresh();
    }
  }

  return (
    <>
      <AdminPageHeader
        label="Danh mục"
        title="Sản phẩm"
        description="Quản lý danh mục sản phẩm của bạn."
        action={
          <AdminFormDialog
            triggerLabel="Thêm sản phẩm"
            title="Thêm sản phẩm"
            description="Tạo sản phẩm mới trong danh mục."
            maxWidthClass="max-w-4xl"
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

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <AdminSearchBar
          search={search}
          status={status}
          limit={limit}
          placeholder="Tìm sản phẩm theo tên…"
        />
        <Select
          value={status || 'all'}
          onValueChange={(value) => {
            router.push(
              buildQueryHref(pathname, {
                search: search || undefined,
                status: value === 'all' ? undefined : value,
                limit: limit === 10 ? undefined : limit,
                page: undefined,
              }),
            );
          }}
        >
          <SelectTrigger className="h-9 w-full bg-background sm:w-[180px]">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả trạng thái</SelectItem>
            <SelectItem value="active">Đang bán</SelectItem>
            <SelectItem value="draft">Bản nháp</SelectItem>
            <SelectItem value="archived">Lưu trữ</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <AdminTable
        data={visibleProducts}
        getRowKey={(row) => row.id}
        emptyMessage={
          search || status
            ? 'Không tìm thấy sản phẩm phù hợp.'
            : 'Chưa có sản phẩm nào.'
        }
        columns={[
          {
            key: 'name',
            header: 'Sản phẩm',
            width: '42%',
            render: (row) => (
              <div className="flex min-w-0 items-center gap-3">
                <ProductThumbnail name={row.name} imageUrl={row.imageUrl} />
                <div className="min-w-0 space-y-0.5">
                  <ProductNameLink name={row.name} slug={row.slug} />
                  <p className="truncate text-xs text-muted-foreground">{row.slug}</p>
                </div>
              </div>
            ),
          },
          {
            key: 'price',
            header: 'Giá',
            width: '13%',
            render: (row) =>
              row.minPrice != null ? (
                <span className="font-medium tabular-nums">{formatPrice(row.minPrice)}</span>
              ) : (
                <span className="text-muted-foreground">—</span>
              ),
          },
          {
            key: 'status',
            header: 'Trạng thái',
            width: '22%',
            render: (row) => <ProductStatusSelect productId={row.id} value={row.status} />,
          },
          {
            key: 'actions',
            header: 'Thao tác',
            align: 'right',
            width: '18%',
            render: (row) => (
              <div className="flex justify-end gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className={`h-8 w-8 cursor-pointer ${adminIconButtonClass}`}
                  aria-label={`Sửa ${row.name}`}
                  onClick={() => void openEdit(row.id)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 cursor-pointer text-destructive hover:bg-destructive/10 hover:text-destructive"
                  aria-label={`Xóa ${row.name}`}
                  onClick={() => setDeleteTarget(row)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ),
          },
        ]}
      />

      <AdminPagination
        page={page}
        limit={limit}
        totalPages={totalPages}
        total={total}
        search={search || undefined}
        status={status || undefined}
        itemLabel="sản phẩm"
        showPageSize
        className="mt-4"
      />

      <AdminFormDialog
        open={editOpen}
        onOpenChange={(open) => {
          if (!open) closeEdit();
          else setEditOpen(true);
        }}
        title="Sửa sản phẩm"
        description={editProduct?.name ?? 'Cập nhật thông tin sản phẩm.'}
        maxWidthClass="max-w-4xl"
      >
        {({ onSuccess, onCancel }) =>
          editLoading ? (
            <p className="text-sm text-muted-foreground">Đang tải sản phẩm…</p>
          ) : editProduct ? (
            <ProductForm
              key={editProduct.id}
              productId={editProduct.id}
              defaultValues={{
                name: editProduct.name,
                slug: editProduct.slug,
                description: editProduct.description ?? undefined,
                status: editProduct.status,
                metaTitle: editProduct.metaTitle ?? undefined,
                metaDescription: editProduct.metaDescription ?? undefined,
              }}
              initialVariants={editProduct.variants}
              initialImages={editProduct.images.map((img) => ({
                id: img.id,
                url: img.url,
                storageKey: img.storageKey,
                alt: img.alt,
                sortOrder: img.sortOrder,
                linkedOptions: img.linkedOptions,
              }))}
              initialMediaOptionName={editProduct.mediaOptionName}
              onSuccess={() => {
                onSuccess();
                closeEdit();
                router.refresh();
              }}
              onCancel={() => {
                onCancel();
                closeEdit();
              }}
            />
          ) : null
        }
      </AdminFormDialog>

      <AdminConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Xóa sản phẩm?"
        description={
          deleteTarget
            ? `"${deleteTarget.name}" sẽ bị xóa vĩnh viễn. Không thể hoàn tác.`
            : ''
        }
        onConfirm={handleDelete}
      />
    </>
  );
}
