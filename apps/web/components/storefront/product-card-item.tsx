'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Eye } from 'lucide-react';
import type { ProductPublic } from '@storix/shared';
import { formatPrice, getProductMinPrice, cn } from '@/lib/utils';
import { useQuickViewStore } from '@/lib/stores/quick-view';

export interface ProductCardProduct extends ProductPublic {
  variants?: { price: number }[];
}

interface ProductCardItemProps {
  product: ProductCardProduct;
}

export function ProductCardItem({ product }: ProductCardItemProps) {
  const openQuickView = useQuickViewStore((s) => s.open);
  const productHref = `/products/${product.slug}`;
  const image = product.images?.[0];
  const minPrice =
    product.minPrice ?? (product.variants ? getProductMinPrice(product.variants) : null);

  function handleQuickView(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    openQuickView(product.slug);
  }

  return (
    <article className="group relative overflow-hidden rounded-xl border border-border bg-card transition-all duration-300 hover:border-primary/30 hover:shadow-lg">
      <Link
        href={productHref}
        className="absolute inset-0 z-0 rounded-xl"
        aria-label={`View ${product.name}`}
      />

      <div className="relative aspect-[4/5] overflow-hidden bg-muted">
        <div className="pointer-events-none relative h-full w-full">
          {image ? (
            <Image
              src={image.url}
              alt={image.alt ?? product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              No image
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-stone-900/40 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        </div>

        <button
          type="button"
          onClick={handleQuickView}
          className={cn(
            'absolute bottom-3 right-3 z-10 flex cursor-pointer items-center gap-1.5 rounded-full bg-background/95 px-3 py-1.5 text-xs font-medium text-foreground shadow-md backdrop-blur-sm transition-all duration-200 hover:bg-background',
            'opacity-100 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100',
          )}
        >
          <Eye className="h-3.5 w-3.5" />
          Quick view
        </button>
      </div>

      <div className="pointer-events-none relative p-4">
        <h3 className="font-medium leading-snug text-foreground transition-colors duration-200 group-hover:text-primary">
          {product.name}
        </h3>
        {minPrice !== null && (
          <p className="mt-1.5 text-sm font-semibold text-primary">{formatPrice(minPrice)}</p>
        )}
      </div>
    </article>
  );
}
