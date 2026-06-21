'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ImageIcon, Pencil, Trash2 } from 'lucide-react';
import type { ProductDetail, ProductStatus } from '@storix/shared';
import { Button } from '@storix/ui/button';
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
  totalPages: number;
  total: number;
  search: string;
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
      title="View product page (draft/archived visible to admins only)"
    >
      {name}
    </Link>
  );
}

export function ProductsPageContent({
  products,
  page,
  totalPages,
  total,
  search,
}: ProductsPageContentProps) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<ProductDetail | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ProductRow | null>(null);

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
    await deleteProductAction(deleteTarget.id);
    router.refresh();
  }

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

      <div className="mb-4">
        <AdminSearchBar search={search} placeholder="Search products by name…" />
      </div>

      <AdminTable
        data={products}
        getRowKey={(row) => row.id}
        emptyMessage={search ? 'No products match your search.' : 'No products yet.'}
        columns={[
          {
            key: 'name',
            header: 'Product',
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
            header: 'Price',
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
            header: 'Status',
            width: '22%',
            render: (row) => <ProductStatusSelect productId={row.id} value={row.status} />,
          },
          {
            key: 'actions',
            header: 'Actions',
            align: 'right',
            width: '18%',
            render: (row) => (
              <div className="flex justify-end gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className={`h-8 w-8 cursor-pointer ${adminIconButtonClass}`}
                  aria-label={`Edit ${row.name}`}
                  onClick={() => void openEdit(row.id)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 cursor-pointer text-destructive hover:bg-destructive/10 hover:text-destructive"
                  aria-label={`Delete ${row.name}`}
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
        totalPages={totalPages}
        total={total}
        search={search || undefined}
        itemLabel="products"
        className="mt-4"
      />

      <AdminFormDialog
        open={editOpen}
        onOpenChange={(open) => {
          if (!open) closeEdit();
          else setEditOpen(true);
        }}
        title="Edit product"
        description={editProduct?.name ?? 'Update product details.'}
      >
        {({ onSuccess, onCancel }) =>
          editLoading ? (
            <p className="text-sm text-muted-foreground">Loading product…</p>
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
              defaultVariant={
                editProduct.variants[0]
                  ? {
                      id: editProduct.variants[0].id,
                      sku: editProduct.variants[0].sku,
                      price: editProduct.variants[0].price,
                      compareAtPrice: editProduct.variants[0].compareAtPrice,
                      inventory: editProduct.variants[0].inventory,
                    }
                  : undefined
              }
              variantCount={editProduct.variants.length}
              initialImages={editProduct.images.map((img) => ({
                id: img.id,
                url: img.url,
                storageKey: img.storageKey,
                alt: img.alt,
                sortOrder: img.sortOrder,
              }))}
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
        title="Delete product?"
        description={
          deleteTarget
            ? `"${deleteTarget.name}" will be permanently deleted. This cannot be undone.`
            : ''
        }
        onConfirm={handleDelete}
      />
    </>
  );
}
