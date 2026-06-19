import { z } from 'zod';

export const StoreLocationSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  address: z.string().min(1),
  phone: z.string().optional().nullable(),
  mapUrl: z.string().url().optional().nullable(),
  hours: z.string().optional().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const CreateStoreLocationSchema = z.object({
  name: z.string().min(1),
  address: z.string().min(1),
  phone: z.string().optional(),
  mapUrl: z.string().url().optional(),
  hours: z.string().optional(),
});

export const UpdateStoreLocationSchema = CreateStoreLocationSchema.partial();

export type StoreLocation = z.infer<typeof StoreLocationSchema>;
export type CreateStoreLocationInput = z.infer<typeof CreateStoreLocationSchema>;
export type UpdateStoreLocationInput = z.infer<typeof UpdateStoreLocationSchema>;
