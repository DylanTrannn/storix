import { cache } from 'react';
import { cookies } from 'next/headers';
import type { Collection, PaginatedResponse, ProductPublic } from '@storix/shared';
import { getValidAccessToken } from '@/lib/auth/session';
import { CART_SESSION_COOKIE } from '@/lib/api/server-proxy';
import { getServerClient } from './client';

export const SEARCH_PRODUCTS_PER_PAGE = 24;
export const SEARCH_COLLECTIONS_PER_PAGE = 12;

export interface SearchCatalogResult {
  query: string;
  products: ProductPublic[];
  collections: Collection[];
  productsMeta: PaginatedResponse<ProductPublic>['meta'];
  collectionsMeta: PaginatedResponse<Collection>['meta'];
}

export const searchCatalog = cache(
  async (
    query: string,
    options?: {
      productPage?: number;
      productLimit?: number;
      collectionPage?: number;
      collectionLimit?: number;
    },
  ): Promise<SearchCatalogResult> => {
    const trimmed = query.trim();
    const productPage = options?.productPage ?? 1;
    const collectionPage = options?.collectionPage ?? 1;
    const productLimit = options?.productLimit ?? SEARCH_PRODUCTS_PER_PAGE;
    const collectionLimit = options?.collectionLimit ?? SEARCH_COLLECTIONS_PER_PAGE;
    const emptyMeta = (page: number, limit: number) => ({
      page,
      limit,
      total: 0,
      totalPages: 0,
    });

    if (!trimmed) {
      return {
        query: trimmed,
        products: [],
        collections: [],
        productsMeta: emptyMeta(productPage, productLimit),
        collectionsMeta: emptyMeta(collectionPage, collectionLimit),
      };
    }

    const token = await getValidAccessToken();
    const cookieStore = await cookies();
    const cartSession = cookieStore.get(CART_SESSION_COOKIE)?.value;
    const client = getServerClient(token, cartSession);

    const [productsRes, collectionsRes] = await Promise.all([
      client.listProducts({
        search: trimmed,
        page: productPage,
        limit: productLimit,
        status: 'active',
      }),
      client.listCollections({
        search: trimmed,
        page: collectionPage,
        limit: collectionLimit,
      }),
    ]);

    return {
      query: trimmed,
      products: productsRes.data as ProductPublic[],
      collections: collectionsRes.data,
      productsMeta: productsRes.meta,
      collectionsMeta: collectionsRes.meta,
    };
  },
);
