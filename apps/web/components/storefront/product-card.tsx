import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight } from 'lucide-react';
import type { Collection } from '@storix/shared';
import { ProductCardItem, type ProductCardProduct } from '@/components/storefront/product-card-item';

export function ProductGrid({ products }: { products: ProductCardProduct[] }) {
  if (products.length === 0) {
    return (
      <p className="py-16 text-center text-muted-foreground">No products found.</p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCardItem key={product.id} product={product} />
      ))}
    </div>
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
