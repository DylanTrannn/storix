import type { ProductStatus } from '@storix/shared';

export class ProductImageEntity {
  constructor(
    public readonly id: string,
    public readonly productId: string,
    public readonly url: string,
    public readonly storageKey: string,
    public readonly alt: string | null,
    public readonly sortOrder: number,
  ) {}
}

export class ProductVariantEntity {
  constructor(
    public readonly id: string,
    public readonly productId: string,
    public readonly sku: string,
    public readonly price: number,
    public readonly compareAtPrice: number | null,
    public readonly inventory: number,
    public readonly options: Record<string, string>,
    public readonly imageUrl: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}

export class ProductEntity {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly slug: string,
    public readonly description: string | null,
    public readonly status: ProductStatus,
    public readonly metaTitle: string | null,
    public readonly metaDescription: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly images: ProductImageEntity[] = [],
    public readonly variants: ProductVariantEntity[] = [],
  ) {}

  getPrimaryImage(): ProductImageEntity | null {
    if (!this.images.length) return null;
    return [...this.images].sort((a, b) => a.sortOrder - b.sortOrder)[0] ?? null;
  }

  getMinPrice(): number | null {
    if (!this.variants.length) return null;
    return Math.min(...this.variants.map((v) => v.price));
  }

  toPublic() {
    const primary = this.getPrimaryImage();
    return {
      id: this.id,
      name: this.name,
      slug: this.slug,
      description: this.description,
      status: this.status,
      metaTitle: this.metaTitle,
      metaDescription: this.metaDescription,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      images: primary ? [{ url: primary.url, alt: primary.alt }] : [],
      minPrice: this.getMinPrice(),
    };
  }

  toDetail() {
    return {
      ...this.toPublic(),
      images: this.images.map((img) => ({
        id: img.id,
        productId: img.productId,
        url: img.url,
        storageKey: img.storageKey,
        alt: img.alt,
        sortOrder: img.sortOrder,
      })),
      variants: this.variants.map((v) => ({
        id: v.id,
        productId: v.productId,
        sku: v.sku,
        price: v.price,
        compareAtPrice: v.compareAtPrice,
        inventory: v.inventory,
        options: v.options,
        imageUrl: v.imageUrl,
        createdAt: v.createdAt,
        updatedAt: v.updatedAt,
      })),
    };
  }
}
