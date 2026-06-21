import { z } from 'zod';
import { PRODUCT_STATUSES } from '../constants.js';

export const ProductImageSchema = z.object({
  id: z.string().uuid(),
  productId: z.string().uuid(),
  url: z.string().url(),
  storageKey: z.string(),
  alt: z.string().optional().nullable(),
  sortOrder: z.number().int(),
});

export const ProductVariantSchema = z.object({
  id: z.string().uuid(),
  productId: z.string().uuid(),
  sku: z.string().min(1),
  price: z.number().int().positive(),
  compareAtPrice: z.number().int().positive().optional().nullable(),
  inventory: z.number().int().min(0),
  options: z.record(z.string()).default({}),
  imageUrl: z.string().url().optional().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const ProductSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional().nullable(),
  status: z.enum(PRODUCT_STATUSES),
  metaTitle: z.string().optional().nullable(),
  metaDescription: z.string().optional().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const ProductPublicSchema = ProductSchema.extend({
  images: z
    .array(
      z.object({
        url: z.string().url(),
        alt: z.string().optional().nullable(),
      }),
    )
    .optional(),
  minPrice: z.number().int().positive().optional().nullable(),
});

export const ProductDetailSchema = ProductSchema.extend({
  images: z.array(ProductImageSchema),
  variants: z.array(ProductVariantSchema),
});

/** Empty slug → undefined so API can auto-generate from name */
const optionalSlug = z.preprocess(
  (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
  z.string().min(1).optional(),
);

export const CreateProductSchema = z.object({
  name: z.string().min(1),
  slug: optionalSlug,
  description: z.string().optional(),
  status: z.enum(PRODUCT_STATUSES).optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
});

export const UpdateProductSchema = CreateProductSchema.partial();

export const CreateProductVariantSchema = z.object({
  sku: z.string().min(1),
  price: z.number().int().positive(),
  compareAtPrice: z.number().int().positive().optional(),
  inventory: z.number().int().min(0).default(0),
  options: z.record(z.string()).optional(),
  imageUrl: z.string().url().optional(),
});

export const UpdateProductVariantSchema = CreateProductVariantSchema.partial();

export const CreateProductImageSchema = z.object({
  url: z.string().url(),
  storageKey: z.string().min(1),
  alt: z.string().optional(),
  sortOrder: z.number().int().optional(),
});

export type Product = z.infer<typeof ProductSchema>;
export type ProductPublic = z.infer<typeof ProductPublicSchema>;
export type ProductDetail = z.infer<typeof ProductDetailSchema>;
export type ProductVariant = z.infer<typeof ProductVariantSchema>;
export type ProductImage = z.infer<typeof ProductImageSchema>;
export type CreateProductInput = z.infer<typeof CreateProductSchema>;
export type UpdateProductInput = z.infer<typeof UpdateProductSchema>;
export type CreateProductVariantInput = z.infer<typeof CreateProductVariantSchema>;
export type UpdateProductVariantInput = z.infer<typeof UpdateProductVariantSchema>;
export type CreateProductImageInput = z.infer<typeof CreateProductImageSchema>;
