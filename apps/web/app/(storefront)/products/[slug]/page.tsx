import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { getProductBySlug } from '@/lib/api';
import { AddToCartButton, WishlistButton } from '@/components/product/add-to-cart-button';
import { ProductJsonLd } from '@/components/product/product-json-ld';
import { ProductDetailSkeleton } from '@/components/skeletons';

export const revalidate = 60;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const product = await getProductBySlug(slug);
    return {
      title: product.metaTitle ?? product.name,
      description: product.metaDescription ?? product.description ?? undefined,
      openGraph: {
        title: product.metaTitle ?? product.name,
        description: product.metaDescription ?? product.description ?? undefined,
        images: product.images[0] ? [{ url: product.images[0].url }] : undefined,
      },
    };
  } catch {
    return { title: 'Product not found' };
  }
}

async function ProductContent({ slug }: { slug: string }) {
  let product;
  try {
    product = await getProductBySlug(slug);
  } catch {
    notFound();
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const productUrl = `${appUrl}/products/${slug}`;

  const variantData = product.variants.map((v) => ({
    id: v.id,
    price: v.price,
    inventory: v.inventory,
    options: v.options,
  }));

  return (
    <>
      <ProductJsonLd product={product} url={productUrl} />
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2">
          <div className="space-y-4">
            {product.images.length > 0 ? (
              <div className="relative aspect-square overflow-hidden rounded-2xl border border-border bg-muted shadow-lg">
                <Image
                  src={product.images[0].url}
                  alt={product.images[0].alt ?? product.name}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="flex aspect-square items-center justify-center rounded-xl bg-muted text-muted-foreground">
                No image available
              </div>
            )}
            {product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {product.images.slice(1, 5).map((image) => (
                  <div key={image.id} className="relative aspect-square overflow-hidden rounded-md bg-muted">
                    <Image
                      src={image.url}
                      alt={image.alt ?? product.name}
                      fill
                      sizes="100px"
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col lg:py-4">
            <span className="inline-flex w-fit rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold capitalize text-primary">
              {product.status}
            </span>
            <h1 className="heading-display mt-4 text-4xl sm:text-5xl">{product.name}</h1>
            {product.description && (
              <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
                {product.description}
              </p>
            )}
            <div className="mt-10 space-y-3 border-t border-border pt-8">
              <AddToCartButton variants={variantData} />
              <WishlistButton productId={product.id} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;

  return (
    <Suspense fallback={
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <ProductDetailSkeleton />
      </div>
    }>
      <ProductContent slug={slug} />
    </Suspense>
  );
}
