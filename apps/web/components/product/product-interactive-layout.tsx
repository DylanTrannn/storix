'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { ProductImageCarousel, type CarouselImage } from '@/components/product/product-image-carousel';
import { ProductPurchaseBlock, type PurchaseVariant } from '@/components/product/product-purchase-block';
import { WishlistButton } from '@/components/product/add-to-cart-button';
import { buildStorefrontGallery, resolveScrollImageUrl } from '@/lib/product/variants';

interface ProductImageWithOptions extends CarouselImage {
  linkedOptions?: Record<string, string> | null;
}

interface ProductInteractiveLayoutProps {
  productId: string;
  productName: string;
  images: ProductImageWithOptions[];
  variants: PurchaseVariant[];
  mediaOptionName?: string | null;
  priority?: boolean;
  purchaseSize?: 'default' | 'compact';
  showWishlist?: boolean;
  info?: ReactNode;
  afterPurchase?: ReactNode;
  footer?: ReactNode;
}

export function ProductInteractiveLayout({
  productId,
  productName,
  images,
  variants,
  mediaOptionName,
  priority = false,
  purchaseSize = 'default',
  showWishlist = true,
  info,
  afterPurchase,
  footer,
}: ProductInteractiveLayoutProps) {
  const [selection, setSelection] = useState<Record<string, string>>({});

  const galleryImages = useMemo(
    () => buildStorefrontGallery(images, mediaOptionName) as CarouselImage[],
    [images, mediaOptionName],
  );

  const mediaSelectionValue = mediaOptionName ? selection[mediaOptionName] : undefined;

  const scrollToImageUrl = useMemo(
    () => resolveScrollImageUrl(images, selection, mediaOptionName),
    [images, selection, mediaOptionName, mediaSelectionValue],
  );

  return (
    <div className="grid gap-12 lg:grid-cols-2">
      <ProductImageCarousel
        images={galleryImages}
        productName={productName}
        scrollToImageUrl={scrollToImageUrl}
        priority={priority}
        className={purchaseSize === 'compact' ? 'md:sticky md:top-0' : undefined}
      />

      <div className="flex flex-col lg:py-4">
        {info}
        <div
          className={
            info
              ? purchaseSize === 'compact'
                ? 'mt-6 space-y-3'
                : 'mt-10 space-y-3 border-t border-border pt-8'
              : undefined
          }
        >
          <ProductPurchaseBlock
            variants={variants}
            size={purchaseSize}
            onSelectionChange={setSelection}
          />
          {afterPurchase && (
            <div
              className={
                purchaseSize === 'compact'
                  ? 'border-t border-border pt-4'
                  : 'border-t border-border pt-8'
              }
            >
              {afterPurchase}
            </div>
          )}
          {showWishlist && <WishlistButton productId={productId} />}
          {footer}
        </div>
      </div>
    </div>
  );
}
