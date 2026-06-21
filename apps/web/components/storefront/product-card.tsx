import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight } from 'lucide-react';
import type { Collection, Product } from '@storix/shared';
import { formatPrice, getProductMinPrice } from '@/lib/utils';

interface ProductCardProps {
  product: Product & { images?: { url: string; alt?: string | null }[]; variants?: { price: number }[] };
}

export function ProductCard({ product }: ProductCardProps) {
  const image = product.images?.[0];
  const minPrice =
    product.minPrice ?? (product.variants ? getProductMinPrice(product.variants) : null);

  return (
    <Link href={`/products/${product.slug}`} className="group block cursor-pointer">
      <article className="overflow-hidden rounded-xl border border-border bg-card transition-all duration-300 hover:border-primary/30 hover:shadow-lg">
        <div className="relative aspect-[4/5] overflow-hidden bg-muted">
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
          <div className="absolute bottom-3 right-3 flex h-9 w-9 translate-y-2 items-center justify-center rounded-full bg-primary text-primary-foreground opacity-0 shadow-md transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            <ArrowUpRight className="h-4 w-4" />
          </div>
        </div>
        <div className="p-4">
          <h3 className="font-medium leading-snug text-foreground transition-colors duration-200 group-hover:text-primary">
            {product.name}
          </h3>
          {minPrice !== null && (
            <p className="mt-1.5 text-sm font-semibold text-primary">{formatPrice(minPrice)}</p>
          )}
        </div>
      </article>
    </Link>
  );
}

interface CollectionCardProps {
  collection: Collection;
}

export function CollectionCard({ collection }: CollectionCardProps) {
  return (
    <Link href={`/collections/${collection.slug}`} className="group block cursor-pointer">
      <article className="relative overflow-hidden rounded-xl border border-border bg-card transition-all duration-300 hover:border-primary/30 hover:shadow-xl">
        <div className="relative aspect-[16/10] overflow-hidden bg-muted">
          {collection.imageUrl ? (
            <Image
              src={collection.imageUrl}
              alt={collection.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-stone-200 text-sm text-muted-foreground">
              {collection.name}
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-stone-900/80 via-stone-900/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <span className="mb-3 inline-flex w-fit rounded-full bg-primary px-2.5 py-0.5 text-xs font-semibold text-primary-foreground">
              Collection
            </span>
            <h3 className="heading-display text-2xl text-white">{collection.name}</h3>
            {collection.description && (
              <p className="mt-2 line-clamp-2 text-sm text-stone-300">{collection.description}</p>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}

export function ProductGrid({ products }: { products: ProductCardProps['product'][] }) {
  if (products.length === 0) {
    return (
      <p className="py-16 text-center text-muted-foreground">No products found.</p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

export function CollectionGrid({ collections }: { collections: Collection[] }) {
  if (collections.length === 0) {
    return (
      <p className="py-16 text-center text-muted-foreground">No collections found.</p>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {collections.map((collection) => (
        <CollectionCard key={collection.id} collection={collection} />
      ))}
    </div>
  );
}

export function SectionHeader({
  label,
  title,
  href,
  linkText = 'View all',
}: {
  label: string;
  title: string;
  href?: string;
  linkText?: string;
}) {
  return (
    <div className="mb-10 flex items-end justify-between gap-4">
      <div>
        <p className="section-label">{label}</p>
        <h2 className="heading-display mt-2 text-3xl sm:text-4xl">{title}</h2>
      </div>
      {href && (
        <Link
          href={href}
          className="hidden cursor-pointer text-sm font-semibold text-primary transition-colors duration-200 hover:text-primary/80 sm:inline-flex sm:items-center sm:gap-1"
        >
          {linkText}
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}
