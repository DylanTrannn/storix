import { z } from 'zod';

export const WishlistItemSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  productId: z.string().uuid(),
  product: z
    .object({
      id: z.string().uuid(),
      name: z.string(),
      slug: z.string(),
      imageUrl: z.string().nullable().optional(),
      minPrice: z.number().int().optional(),
    })
    .optional(),
  createdAt: z.coerce.date(),
});

export const WishlistSchema = z.object({
  items: z.array(WishlistItemSchema),
});

export const AddToWishlistSchema = z.object({
  productId: z.string().uuid(),
});

export type WishlistItem = z.infer<typeof WishlistItemSchema>;
export type AddToWishlistInput = z.infer<typeof AddToWishlistSchema>;
