import type { AddToCartInput, AddToWishlistInput, Cart, CheckoutInput, Order, ProductDetail, UpdateCartItemInput } from '@storix/shared';

async function storefrontRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (init?.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(path, {
    ...init,
    credentials: 'include',
    headers,
  });

  if (!response.ok) {
    let message = 'Request failed';
    try {
      const data = (await response.json()) as { message?: string };
      if (data.message) message = data.message;
    } catch {
      // ignore parse errors
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export function getStorefrontCart() {
  return storefrontRequest<Cart>('/api/cart');
}

export function getStorefrontProductBySlug(slug: string) {
  return storefrontRequest<ProductDetail>(`/api/products/${encodeURIComponent(slug)}`);
}

export function addToStorefrontCart(data: AddToCartInput) {
  return storefrontRequest<Cart>('/api/cart/items', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateStorefrontCartItem(itemId: string, data: UpdateCartItemInput) {
  return storefrontRequest<Cart>(`/api/cart/items/${itemId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export function removeStorefrontCartItem(itemId: string) {
  return storefrontRequest<Cart>(`/api/cart/items/${itemId}`, {
    method: 'DELETE',
  });
}

export function addToStorefrontWishlist(data: AddToWishlistInput) {
  return storefrontRequest<void>('/api/wishlist/items', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function removeFromStorefrontWishlist(productId: string) {
  return storefrontRequest<void>(`/api/wishlist/items/${productId}`, {
    method: 'DELETE',
  });
}

export function checkoutStorefront(data: CheckoutInput) {
  return storefrontRequest<Order>('/api/checkout', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
