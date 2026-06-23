import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { getProductBySlugWithPreview } from '@/lib/api';
import { ProductInteractiveLayout } from '@/components/product/product-interactive-layout';
import { ProductImageCarousel } from '@/components/product/product-image-carousel';
import { ProductJsonLd } from '@/components/product/product-json-ld';
import { ProductPreviewBanner } from '@/components/product/product-preview-banner';
import { ProductDetailSkeleton } from '@/components/skeletons';
import { formatPrice, getProductMinPrice } from '@/lib/utils';

export const revalidate = 60;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const { product, isPreview } = await getProductBySlugWithPreview(slug);
    return {
      title: product.metaTitle ?? product.name,
      description: product.metaDescription ?? product.description ?? undefined,
      robots: isPreview ? { index: false, follow: false } : undefined,
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
  let isPreview = false;
  try {
    const result = await getProductBySlugWithPreview(slug);
    product = result.product;
    isPreview = result.isPreview;
  } catch {
    notFound();
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const productUrl = `${appUrl}/products/${slug}`;

  const variantData = product.variants.map((v) => ({
    id: v.id,
    price: v.price,
    compareAtPrice: v.compareAtPrice,
    inventory: v.inventory,
    options: v.options,
    imageUrl: v.imageUrl,
  }));
  const minPrice = getProductMinPrice(product.variants);

  const productHeader = (
    <>
      {isPreview && (
        <span className="inline-flex w-fit rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold capitalize text-amber-900">
          {product.status}
        </span>
      )}
      <h1 className="heading-display mt-4 text-4xl sm:text-5xl">{product.name}</h1>
      {isPreview && minPrice !== null && (
        <p className="mt-6 text-3xl font-semibold tracking-tight">{formatPrice(minPrice)}</p>
      )}
    </>
  );

  const productDescription = product.description ? (
    <p className="text-lg leading-relaxed text-muted-foreground">{product.description}</p>
  ) : null;

  return (
    <>
      {isPreview && <ProductPreviewBanner status={product.status} />}
      {!isPreview && product.status === 'active' && (
        <ProductJsonLd product={product} url={productUrl} />
      )}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {isPreview ? (
          <div className="grid gap-12 lg:grid-cols-2">
            <ProductImageCarousel
              images={product.images}
              productName={product.name}
              priority
            />
            <div className="flex flex-col lg:py-4">
              {productHeader}
              {productDescription && (
                <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
                  {product.description}
                </p>
              )}
            </div>
          </div>
        ) : (
          <ProductInteractiveLayout
            productId={product.id}
            productName={product.name}
            images={product.images}
            variants={variantData}
            mediaOptionName={product.mediaOptionName}
            priority
            info={productHeader}
            afterPurchase={productDescription}
            showWishlist
          />
        )}
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
