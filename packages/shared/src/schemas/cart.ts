import { z } from 'zod';

export const CartItemSchema = z.object({
  id: z.string().uuid(),
  cartId: z.string().uuid(),
  variantId: z.string().uuid(),
  quantity: z.number().int().positive(),
  variant: z
    .object({
      id: z.string().uuid(),
      sku: z.string(),
      price: z.number().int(),
      inventory: z.number().int().min(0).optional(),
      options: z.record(z.string()),
      imageUrl: z.string().url().nullable().optional(),
      product: z.object({
        id: z.string().uuid(),
        name: z.string(),
        slug: z.string(),
      }),
    })
    .optional(),
});

export const CartSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid().nullable().optional(),
  sessionId: z.string().nullable().optional(),
  items: z.array(CartItemSchema),
  subtotal: z.number().int(),
  itemCount: z.number().int(),
});

export const AddToCartSchema = z.object({
  variantId: z.string().uuid(),
  quantity: z.number().int().positive().default(1),
});

export const UpdateCartItemSchema = z.object({
  quantity: z.number().int().positive(),
});

export type Cart = z.infer<typeof CartSchema>;
export type CartItem = z.infer<typeof CartItemSchema>;
export type AddToCartInput = z.infer<typeof AddToCartSchema>;
export type UpdateCartItemInput = z.infer<typeof UpdateCartItemSchema>;
