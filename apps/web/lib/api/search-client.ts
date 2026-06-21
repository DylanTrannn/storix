import type { Collection, ProductPublic } from '@storix/shared';
import { getBrowserClient } from './client';

export interface SearchSuggestionsResult {
  products: ProductPublic[];
  collections: Collection[];
}

export async function fetchSearchSuggestions(
  query: string,
  limit = 5,
): Promise<SearchSuggestionsResult> {
  const trimmed = query.trim();
  if (!trimmed) {
    return { products: [], collections: [] };
  }

  const client = getBrowserClient();
  const [productsRes, collectionsRes] = await Promise.all([
    client.listProducts({
      search: trimmed,
      page: 1,
      limit,
      status: 'active',
    }),
    client.listCollections({
      search: trimmed,
      page: 1,
      limit,
    }),
  ]);

  return {
    products: productsRes.data as ProductPublic[],
    collections: collectionsRes.data,
  };
}
