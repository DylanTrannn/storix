import { notFound } from 'next/navigation';
import { getAdminProduct } from '@/lib/api';
import { ProductForm } from '@/components/admin/product-form';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: PageProps) {
  const { id } = await params;

  let product;
  try {
    product = await getAdminProduct(id);
  } catch {
    notFound();
  }

  return (
    <div>
      <h1 className="heading-display text-2xl">Edit product</h1>
      <p className="mt-1 text-sm text-muted-foreground">{product.name}</p>
      <div className="mt-6 max-w-2xl">
        <ProductForm
          productId={product.id}
          defaultValues={{
            name: product.name,
            slug: product.slug,
            description: product.description ?? undefined,
            status: product.status,
            metaTitle: product.metaTitle ?? undefined,
            metaDescription: product.metaDescription ?? undefined,
          }}
          initialImages={product.images.map((img) => ({
            id: img.id,
            url: img.url,
            storageKey: img.storageKey,
            alt: img.alt,
            sortOrder: img.sortOrder,
          }))}
        />
      </div>
    </div>
  );
}
