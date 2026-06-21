import { z } from 'zod';

export const PresignUploadSchema = z.object({
  filename: z.string().min(1),
  contentType: z.string().min(1),
  context: z.enum(['product', 'collection']).default('product'),
});

export const PresignUploadResponseSchema = z.object({
  uploadUrl: z.string().url(),
  storageKey: z.string(),
  publicUrl: z.string().url(),
  expiresIn: z.number().int(),
});

export const BatchCreateProductImagesSchema = z.object({
  images: z
    .array(
      z.object({
        url: z.string().url(),
        storageKey: z.string().min(1),
        alt: z.string().optional(),
        sortOrder: z.number().int().optional(),
      }),
    )
    .min(1)
    .max(20),
});

export const ReorderProductImagesSchema = z.object({
  imageIds: z.array(z.string().uuid()).min(1),
});

export type PresignUploadInput = z.infer<typeof PresignUploadSchema>;
export type PresignUploadResponse = z.infer<typeof PresignUploadResponseSchema>;
export type BatchCreateProductImagesInput = z.infer<typeof BatchCreateProductImagesSchema>;
export type ReorderProductImagesInput = z.infer<typeof ReorderProductImagesSchema>;
