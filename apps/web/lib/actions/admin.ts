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
