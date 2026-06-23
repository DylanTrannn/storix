'use server';

import { revalidatePath } from 'next/cache';
import type {
  BatchCreateProductImagesInput,
  CreateCollectionInput,
  CreateProductImageInput,
  CreateProductInput,
  CreateProductVariantInput,
  OrderStatus,
  PresignUploadInput,
  ReorderProductImagesInput,
  UpdateCollectionInput,
  UpdateProductInput,
  UpdateProductImageInput,
  UpdateProductVariantInput,
} from '@storix/shared';
import { getValidAccessToken } from '@/lib/auth/session';
import { getServerClient } from '@/lib/api/client';

async function getAuthedClient() {
  const token = await getValidAccessToken();
  if (!token) {
    throw new Error('Unauthorized');
  }
  return getServerClient(token);
}

export async function createProductAction(data: CreateProductInput) {
  const client = await getAuthedClient();
  const product = await client.createProduct(data);
  revalidatePath('/admin/products');
  return product;
}

export async function getAdminProductAction(id: string) {
  const client = await getAuthedClient();
  return client.getProduct(id);
}

export async function updateProductAction(id: string, data: UpdateProductInput) {
  const client = await getAuthedClient();
  const product = await client.updateProduct(id, data);
  revalidatePath('/admin/products');
  revalidatePath(`/products/${product.slug}`);
  return product;
}

export async function createProductVariantAction(
  productId: string,
  data: CreateProductVariantInput,
) {
  const client = await getAuthedClient();
  const product = await client.createProductVariant(productId, data);
  revalidatePath('/admin/products');
  revalidatePath(`/products/${product.slug}`);
  return product;
}

export async function updateProductVariantAction(
  productId: string,
  variantId: string,
  data: UpdateProductVariantInput,
) {
  const client = await getAuthedClient();
  const product = await client.updateProductVariant(productId, variantId, data);
  revalidatePath('/admin/products');
  revalidatePath(`/products/${product.slug}`);
  return product;
}

export async function deleteProductAction(id: string) {
  const client = await getAuthedClient();
  await client.deleteProduct(id);
  revalidatePath('/admin/products');
}

export async function deleteProductVariantAction(productId: string, variantId: string) {
  const client = await getAuthedClient();
  await client.deleteProductVariant(productId, variantId);
  const product = await client.getProduct(productId);
  revalidatePath('/admin/products');
  revalidatePath(`/products/${product.slug}`);
  return product;
}

export interface SyncVariantInput {
  id?: string;
  sku: string;
  price: number;
  compareAtPrice?: number;
  inventory: number;
  options: Record<string, string>;
  imageUrl?: string | null;
}

export async function syncProductVariantsAction(
  productId: string,
  variants: SyncVariantInput[],
  _existingVariantIds: string[],
  mediaOptionName?: string | null,
) {
  const client = await getAuthedClient();
  const currentProduct = await client.getProduct(productId);

  for (const existing of currentProduct.variants) {
    await client.deleteProductVariant(productId, existing.id);
  }

  for (const variant of variants) {
    const payload = {
      sku: variant.sku,
      price: variant.price,
      compareAtPrice: variant.compareAtPrice,
      inventory: variant.inventory,
      options: variant.options,
      ...(mediaOptionName
        ? { imageUrl: null }
        : { imageUrl: variant.imageUrl ?? undefined }),
    };

    await client.createProductVariant(productId, payload);
  }

  const product = await client.getProduct(productId);
  revalidatePath('/admin/products');
  revalidatePath(`/products/${product.slug}`);
  return product;
}

export async function presignUploadAction(data: PresignUploadInput) {
  const client = await getAuthedClient();
  return client.presignUpload(data);
}

export async function addProductImageAction(productId: string, data: CreateProductImageInput) {
  const client = await getAuthedClient();
  const product = await client.addProductImage(productId, data);
  revalidatePath('/admin/products');
  revalidatePath(`/admin/products/${productId}`);
  return product;
}

export async function addProductImagesAction(
  productId: string,
  data: BatchCreateProductImagesInput,
) {
  const client = await getAuthedClient();
  const product = await client.addProductImages(productId, data);
  revalidatePath('/admin/products');
  revalidatePath(`/admin/products/${productId}`);
  return product;
}

export async function reorderProductImagesAction(
  productId: string,
  data: ReorderProductImagesInput,
) {
  const client = await getAuthedClient();
  const product = await client.reorderProductImages(productId, data);
  revalidatePath(`/admin/products/${productId}`);
  return product;
}

export async function deleteProductImageAction(productId: string, imageId: string) {
  const client = await getAuthedClient();
  const product = await client.deleteProductImage(productId, imageId);
  revalidatePath(`/admin/products/${productId}`);
  return product;
}

export async function updateProductImageAction(
  productId: string,
  imageId: string,
  data: UpdateProductImageInput,
) {
  const client = await getAuthedClient();
  const product = await client.updateProductImage(productId, imageId, data);
  revalidatePath('/admin/products');
  revalidatePath(`/admin/products/${productId}`);
  revalidatePath(`/products/${product.slug}`);
  return product;
}

export async function syncProductImageMetadataAction(
  productId: string,
  images: Array<{
    id?: string;
    alt?: string | null;
    linkedOptions?: Record<string, string> | null;
  }>,
) {
  const client = await getAuthedClient();
  for (const image of images) {
    if (!image.id) continue;
    await client.updateProductImage(productId, image.id, {
      alt: image.alt ?? undefined,
      linkedOptions: image.linkedOptions ?? null,
    });
  }
  const product = await client.getProduct(productId);
  revalidatePath('/admin/products');
  revalidatePath(`/admin/products/${productId}`);
  revalidatePath(`/products/${product.slug}`);
  return product;
}

export async function createCollectionAction(data: CreateCollectionInput) {
  const client = await getAuthedClient();
  await client.createCollection(data);
  revalidatePath('/admin/collections');
}

export async function updateCollectionAction(id: string, data: UpdateCollectionInput) {
  const client = await getAuthedClient();
  await client.updateCollection(id, data);
  revalidatePath('/admin/collections');
  revalidatePath(`/admin/collections/${id}`);
}

export async function updateOrderStatusAction(orderId: string, status: OrderStatus) {
  const client = await getAuthedClient();
  await client.updateOrderStatus(orderId, { status });
  revalidatePath('/admin/orders');
  revalidatePath(`/admin/orders/${orderId}`);
}

export async function confirmOrderPaymentAction(orderId: string, confirmed: boolean) {
  const client = await getAuthedClient();
  await client.confirmOrderPayment(orderId, { confirmed });
  revalidatePath('/admin/orders');
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath(`/orders/${orderId}`);
  revalidatePath(`/orders/${orderId}/pay`);
}
