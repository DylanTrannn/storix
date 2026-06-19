import { cache } from 'react';
import { cookies } from 'next/headers';
import type { Cart, ProductListQuery } from '@storix/shared';
import { getAccessToken } from '@/lib/auth/cookies';
import { API_URL, CART_SESSION_COOKIE } from '@/lib/api/server-proxy';
import { getServerClient } from './client';

async function getClient() {
  const token = await getAccessToken();
  const cookieStore = await cookies();
  const cartSession = cookieStore.get(CART_SESSION_COOKIE)?.value;

  return getServerClient(token, cartSession);
}

async function fetchCart(): Promise<Cart> {
  const headers = await (async () => {
    const h = new Headers();
    const token = await getAccessToken();
    if (token) h.set('Authorization', `Bearer ${token}`);
    const cookieStore = await cookies();
    const cartSession = cookieStore.get(CART_SESSION_COOKIE)?.value;
    if (cartSession) h.set('Cookie', `${CART_SESSION_COOKIE}=${cartSession}`);
    return h;
  })();

  const response = await fetch(`${API_URL}/cart`, { headers, cache: 'no-store' });
  if (!response.ok) {
    throw new Error('Failed to load cart');
  }
  return response.json();
}

export const getFeaturedCollections = cache(async (limit = 4) => {
  const client = await getClient();
  const response = await client.listCollections({ page: 1, limit });
  return response.data;
});

export const getFeaturedProducts = cache(async (limit = 8) => {
  const client = await getClient();
  const response = await client.listProducts({
    page: 1,
    limit,
    status: 'active',
    sort: 'createdAt',
    direction: 'desc',
  });
  return response.data;
});

export const getProductBySlug = cache(async (slug: string) => {
  const client = await getClient();
  return client.getProductBySlug(slug);
});

export const getCollectionBySlug = cache(
  async (slug: string, query?: { page?: number; limit?: number; sort?: string; direction?: string }) => {
    const client = await getClient();
    if (slug === 'all') {
      const products = await client.listProducts({
        page: query?.page ?? 1,
        limit: query?.limit ?? 20,
        sort: query?.sort as ProductListQuery['sort'],
        direction: query?.direction as ProductListQuery['direction'],
        status: 'active',
      });
      return {
        id: 'all',
        name: 'All products',
        slug: 'all',
        description: 'Browse our full collection of curated goods.',
        imageUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        productCount: products.meta.total,
        products,
      };
    }
    return client.getCollectionBySlug(slug, query);
  },
);

export const getProducts = cache(async (query?: Partial<ProductListQuery>) => {
  const client = await getClient();
  return client.listProducts(query);
});

export const getCollections = cache(async (query?: { page?: number; limit?: number }) => {
  const client = await getClient();
  return client.listCollections(query);
});

export const getCart = cache(async () => fetchCart());

export const getWishlist = cache(async () => {
  const client = await getClient();
  return client.getWishlist();
});

export const getStoreLocations = cache(async () => {
  const client = await getClient();
  return client.listStoreLocations();
});

export const getCurrentUser = cache(async () => {
  const client = await getClient();
  try {
    return await client.getMe();
  } catch {
    return null;
  }
});

export const getOrder = cache(async (id: string) => {
  const client = await getClient();
  return client.getOrder(id);
});

export const getOrders = cache(async (query?: { page?: number; limit?: number }) => {
  const client = await getClient();
  return client.listOrders(query);
});

export const getAdminProduct = cache(async (id: string) => {
  const client = await getClient();
  return client.getProduct(id);
});

export const getAdminCollection = cache(async (id: string) => {
  const client = await getClient();
  return client.getCollection(id);
});

export const getAdminProducts = cache(async (query?: Partial<ProductListQuery>) => {
  const client = await getClient();
  return client.listProducts(query);
});

export const getAdminCollections = cache(async (query?: { page?: number; limit?: number }) => {
  const client = await getClient();
  return client.listCollections(query);
});

export const getAdminOrders = cache(async (query?: { page?: number; limit?: number }) => {
  const client = await getClient();
  return client.listOrders(query);
});

export const getAdminOrder = cache(async (id: string) => {
  const client = await getClient();
  return client.getOrder(id);
});

export const getAdminCustomers = cache(async (query?: { page?: number; limit?: number; search?: string }) => {
  const client = await getClient();
  return client.listCustomers(query);
});

export const getAdminCustomer = cache(async (id: string) => {
  const client = await getClient();
  return client.getCustomer(id);
});

export const getDashboardStats = cache(async () => {
  const client = await getClient();
  return client.getDashboardStats();
});
