'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@storix/ui/dialog';
import { ProductInteractiveLayout } from '@/components/product/product-interactive-layout';
import { getStorefrontProductBySlug } from '@/lib/api/storefront';
import { useQuickViewStore } from '@/lib/stores/quick-view';

function QuickViewSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="aspect-square animate-pulse rounded-2xl bg-muted" />
      <div className="space-y-4">
        <div className="h-8 w-3/4 animate-pulse rounded bg-muted" />
        <div className="h-16 animate-pulse rounded bg-muted" />
        <div className="h-40 animate-pulse rounded-xl bg-muted" />
      </div>
    </div>
  );
}

export function ProductQuickView() {
  const { slug, isOpen, close } = useQuickViewStore();

  const { data: product, isLoading, isError } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => getStorefrontProductBySlug(slug!),
    enabled: isOpen && !!slug,
  });

  const variantData =
    product?.variants.map((v) => ({
      id: v.id,
      price: v.price,
      compareAtPrice: v.compareAtPrice,
      inventory: v.inventory,
      options: v.options,
      imageUrl: v.imageUrl,
    })) ?? [];

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) close();
      }}
    >
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto p-0 sm:p-0">
        <div className="p-6">
          {isLoading && <QuickViewSkeleton />}

          {isError && (
            <div className="py-8 text-center">
              <p className="text-sm text-destructive">Could not load product. Please try again.</p>
            </div>
          )}

          {product && (
            <>
              <DialogHeader className="sr-only">
                <DialogTitle>{product.name}</DialogTitle>
                <DialogDescription>Quick view for {product.name}</DialogDescription>
              </DialogHeader>

              <ProductInteractiveLayout
                key={product.id}
                productId={product.id}
                productName={product.name}
                images={product.images}
                variants={variantData}
                mediaOptionName={product.mediaOptionName}
                purchaseSize="compact"
                showWishlist={false}
                info={<h2 className="heading-display text-2xl sm:text-3xl">{product.name}</h2>}
                afterPurchase={
                  product.description ? (
                    <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                      {product.description}
                    </p>
                  ) : undefined
                }
                footer={
                  <Link
                    href={`/products/${product.slug}`}
                    onClick={close}
                    className="mt-4 block text-center text-sm font-medium text-primary hover:underline"
                  >
                    View full details
                  </Link>
                }
              />
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
