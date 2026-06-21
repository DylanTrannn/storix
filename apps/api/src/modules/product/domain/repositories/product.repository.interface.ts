import type {
  CreateProductImageInput,
  CreateProductInput,
  CreateProductVariantInput,
  PaginatedResponse,
  ProductListQuery,
  UpdateProductInput,
  UpdateProductVariantInput,
} from '@storix/shared';
import type { ProductEntity } from '../entities/product.entity';

export const PRODUCT_REPOSITORY = Symbol('PRODUCT_REPOSITORY');

export interface IProductRepository {
  findById(id: string): Promise<ProductEntity | null>;
  findBySlug(slug: string, activeOnly?: boolean): Promise<ProductEntity | null>;
  list(query: ProductListQuery): Promise<PaginatedResponse<ProductEntity>>;
  create(data: CreateProductInput): Promise<ProductEntity>;
  update(id: string, data: UpdateProductInput): Promise<ProductEntity | null>;
  delete(id: string): Promise<boolean>;
  addVariant(productId: string, data: CreateProductVariantInput): Promise<ProductEntity | null>;
  updateVariant(
    productId: string,
    variantId: string,
    data: UpdateProductVariantInput,
  ): Promise<ProductEntity | null>;
  deleteVariant(productId: string, variantId: string): Promise<ProductEntity | null>;
  addImage(productId: string, data: CreateProductImageInput): Promise<ProductEntity | null>;
  addImages(productId: string, data: CreateProductImageInput[]): Promise<ProductEntity | null>;
  reorderImages(productId: string, imageIds: string[]): Promise<ProductEntity | null>;
  getImageById(productId: string, imageId: string): Promise<{ storageKey: string; url: string } | null>;
  deleteImage(productId: string, imageId: string): Promise<ProductEntity | null>;
  slugExists(slug: string, excludeId?: string): Promise<boolean>;
}
