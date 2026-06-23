import type {
  AddToCartInput,
  AddToWishlistInput,
  BatchCreateProductImagesInput,
  Cart,
  CheckoutInput,
  Collection,
  CollectionDetail,
  CreateCollectionInput,
  CreateProductImageInput,
  CreateProductInput,
  CreateProductVariantInput,
  ConfirmOrderPaymentInput,
  LoginInput,
  Order,
  OrderDetail,
  OrderPaymentInstructions,
  PaginatedResponse,
  PresignUploadInput,
  PresignUploadResponse,
  Product,
  ProductDetail,
  ProductPublic,
  ProductListQuery,
  RegisterInput,
  ReorderProductImagesInput,
  UpdateCartItemInput,
  UpdateCollectionInput,
  UpdateOrderStatusInput,
  UpdateProductInput,
  UpdateProductImageInput,
  UpdateProductVariantInput,
  UpdateProfileInput,
  User,
  WishlistItem,
} from '@storix/shared';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly data?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface StorixClientConfig {
  baseUrl: string;
  getAccessToken?: () => string | undefined | Promise<string | undefined>;
  credentials?: 'omit' | 'same-origin' | 'include';
  fetch?: typeof fetch;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined | null>;
};

function buildUrl(baseUrl: string, path: string, params?: RequestOptions['params']): string {
  const url = new URL(path.startsWith('http') ? path : `${baseUrl}${path}`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value));
      }
    }
  }
  return url.toString();
}

export function createStorixClient(config: StorixClientConfig) {
  const { baseUrl, getAccessToken, credentials = 'include', fetch: fetchFn = fetch } = config;

  async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const { body, params, headers: initHeaders, ...rest } = options;
    const headers = new Headers(initHeaders);

    if (body !== undefined && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    const token = await getAccessToken?.();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const response = await fetchFn(buildUrl(baseUrl, path, params), {
      ...rest,
      credentials,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      let data: unknown;
      try {
        data = await response.json();
      } catch {
        data = undefined;
      }
      const message =
        typeof data === 'object' && data !== null && 'message' in data
          ? String((data as { message: unknown }).message)
          : response.statusText || 'Request failed';
      throw new ApiError(response.status, message, data);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return response.json() as Promise<T>;
  }

  return {
    // Auth
    register: (data: RegisterInput) =>
      request<AuthResponse>('/auth/register', { method: 'POST', body: data }),

    login: (data: LoginInput) =>
      request<AuthResponse>('/auth/login', { method: 'POST', body: data }),

    refresh: (refreshToken: string) =>
      request<AuthTokens>('/auth/refresh', { method: 'POST', body: { refreshToken } }),

    logout: () => request<void>('/auth/logout', { method: 'POST' }),

    getMe: () => request<User>('/auth/me'),

    // Products
    listProducts: (query?: Partial<ProductListQuery>) =>
      request<PaginatedResponse<ProductPublic>>('/products', { params: query }),

    listAdminProducts: (query?: Partial<ProductListQuery>) =>
      request<PaginatedResponse<ProductPublic>>('/products/admin/list', { params: query }),

    getProductBySlug: (slug: string) => request<ProductDetail>(`/products/${slug}`),

    previewProductBySlug: (slug: string) =>
      request<ProductDetail>(`/products/preview/${slug}`),

    getProduct: (id: string) => request<ProductDetail>(`/products/detail/${id}`),

    createProduct: (data: CreateProductInput) =>
      request<ProductDetail>('/products', { method: 'POST', body: data }),

    updateProduct: (id: string, data: UpdateProductInput) =>
      request<ProductDetail>(`/products/${id}`, { method: 'PATCH', body: data }),

    deleteProduct: (id: string) => request<void>(`/products/${id}`, { method: 'DELETE' }),

    createProductVariant: (productId: string, data: CreateProductVariantInput) =>
      request<ProductDetail>(`/products/${productId}/variants`, { method: 'POST', body: data }),

    updateProductVariant: (
      productId: string,
      variantId: string,
      data: UpdateProductVariantInput,
    ) =>
      request<ProductDetail>(`/products/${productId}/variants/${variantId}`, {
        method: 'PATCH',
        body: data,
      }),

    deleteProductVariant: (productId: string, variantId: string) =>
      request<void>(`/products/${productId}/variants/${variantId}`, { method: 'DELETE' }),

    addProductImage: (productId: string, data: CreateProductImageInput) =>
      request<ProductDetail>(`/products/${productId}/images`, { method: 'POST', body: data }),

    addProductImages: (productId: string, data: BatchCreateProductImagesInput) =>
      request<ProductDetail>(`/products/${productId}/images/batch`, { method: 'POST', body: data }),

    reorderProductImages: (productId: string, data: ReorderProductImagesInput) =>
      request<ProductDetail>(`/products/${productId}/images/reorder`, {
        method: 'PATCH',
        body: data,
      }),

    updateProductImage: (
      productId: string,
      imageId: string,
      data: UpdateProductImageInput,
    ) =>
      request<ProductDetail>(`/products/${productId}/images/${imageId}`, {
        method: 'PATCH',
        body: data,
      }),

    deleteProductImage: (productId: string, imageId: string) =>
      request<ProductDetail>(`/products/${productId}/images/${imageId}`, { method: 'DELETE' }),

    presignUpload: (data: PresignUploadInput) =>
      request<PresignUploadResponse>('/uploads/presign', { method: 'POST', body: data }),

    // Collections
    listCollections: (query?: { page?: number; limit?: number; search?: string }) =>
      request<PaginatedResponse<Collection>>('/collections', { params: query }),

    getCollectionBySlug: (slug: string, query?: { page?: number; limit?: number; sort?: string; direction?: string }) =>
      request<CollectionDetail & { products: PaginatedResponse<Product> }>(
        `/collections/${slug}`,
        { params: query },
      ),

    getCollection: (id: string) => request<CollectionDetail>(`/collections/detail/${id}`),

    createCollection: (data: CreateCollectionInput) =>
      request<Collection>('/collections', { method: 'POST', body: data }),

    updateCollection: (id: string, data: UpdateCollectionInput) =>
      request<Collection>(`/collections/${id}`, { method: 'PATCH', body: data }),

    deleteCollection: (id: string) => request<void>(`/collections/${id}`, { method: 'DELETE' }),

    assignCollectionProducts: (id: string, productIds: string[]) =>
      request<Collection>(`/collections/${id}/products`, {
        method: 'PUT',
        body: { productIds },
      }),

    // Cart
    getCart: () => request<Cart>('/cart'),

    addToCart: (data: AddToCartInput) =>
      request<Cart>('/cart/items', { method: 'POST', body: data }),

    updateCartItem: (itemId: string, data: UpdateCartItemInput) =>
      request<Cart>(`/cart/items/${itemId}`, { method: 'PATCH', body: data }),

    removeCartItem: (itemId: string) =>
      request<Cart>(`/cart/items/${itemId}`, { method: 'DELETE' }),

    // Orders
    checkout: (data: CheckoutInput) =>
      request<OrderDetail>('/orders/checkout', { method: 'POST', body: data }),

    listOrders: (query?: { page?: number; limit?: number }) =>
      request<PaginatedResponse<Order>>('/orders', { params: query }),

    getOrder: (id: string) => request<OrderDetail>(`/orders/${id}`),

    getOrderPaymentInstructions: (id: string) =>
      request<OrderPaymentInstructions>(`/orders/${id}/payment-instructions`),

    markOrderPaid: (id: string) =>
      request<OrderDetail>(`/orders/${id}/mark-paid`, { method: 'POST' }),

    confirmOrderPayment: (id: string, data: ConfirmOrderPaymentInput) =>
      request<OrderDetail>(`/orders/${id}/payment`, { method: 'PATCH', body: data }),

    updateOrderStatus: (id: string, data: UpdateOrderStatusInput) =>
      request<OrderDetail>(`/orders/${id}/status`, { method: 'PATCH', body: data }),

    // Users
    updateProfile: (data: UpdateProfileInput) =>
      request<User>('/users/me', { method: 'PATCH', body: data }),

    listCustomers: (query?: { page?: number; limit?: number; search?: string }) =>
      request<PaginatedResponse<User>>('/admin/customers', { params: query }),

    getCustomer: (id: string) => request<User & { orders?: Order[] }>(`/admin/customers/${id}`),

    // Wishlist
    getWishlist: () => request<{ items: WishlistItem[] }>('/wishlist'),

    addToWishlist: (data: AddToWishlistInput) =>
      request<WishlistItem>('/wishlist', { method: 'POST', body: data }),

    removeFromWishlist: (productId: string) =>
      request<void>(`/wishlist/${productId}`, { method: 'DELETE' }),

    // Admin dashboard stats
    getDashboardStats: () =>
      request<{
        totalOrders: number;
        totalRevenue: number;
        totalProducts: number;
        totalCustomers: number;
        recentOrders: Order[];
      }>('/admin/dashboard'),
  };
}

export type StorixClient = ReturnType<typeof createStorixClient>;
