import { z } from 'zod';

export const CollectionSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const CollectionDetailSchema = CollectionSchema.extend({
  productCount: z.number().int().optional(),
});

export const CreateCollectionSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).optional(),
  description: z.string().optional(),
  imageUrl: z.string().url().optional(),
});

export const UpdateCollectionSchema = CreateCollectionSchema.partial();

export const AssignProductsSchema = z.object({
  productIds: z.array(z.string().uuid()),
});

export type Collection = z.infer<typeof CollectionSchema>;
export type CollectionDetail = z.infer<typeof CollectionDetailSchema>;
export type CreateCollectionInput = z.infer<typeof CreateCollectionSchema>;
export type UpdateCollectionInput = z.infer<typeof UpdateCollectionSchema>;
