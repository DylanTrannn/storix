import type { Collection } from '@storix/shared';

export const NAV_ALL = { href: '/collections/all', label: 'All' } as const;

export const NAV_FEATURED_COLLECTIONS = [
  { slug: 'new-arrivals', label: 'New Arrivals' },
  { slug: 'best-sellers', label: 'Best Sellers' },
] as const;

const featuredSlugs = new Set<string>(NAV_FEATURED_COLLECTIONS.map((item) => item.slug));

export function getShopNavCollections(collections: Collection[]) {
  return collections.filter((collection) => !featuredSlugs.has(collection.slug));
}

export function isShopNavActive(pathname: string, shopCollections: Collection[]) {
  return shopCollections.some((collection) => pathname === `/collections/${collection.slug}`);
}

export function collectionHref(slug: string) {
  return `/collections/${slug}`;
}
