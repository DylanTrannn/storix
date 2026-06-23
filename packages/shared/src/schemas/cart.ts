import { z } from 'zod';

export const CartProductVariantSchema = z.object({
  id: z.string().uuid(),
  options: z.record(z.string()),
  price: z.number().int(),
  inventory: z.number().int().min(0),
  imageUrl: z.string().url().nullable().optional(),
});

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
  productVariants: z.array(CartProductVariantSchema).optional(),
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

export const UpdateCartItemSchema = z
  .object({
    quantity: z.number().int().positive().optional(),
    variantId: z.string().uuid().optional(),
  })
  .refine((data) => data.quantity !== undefined || data.variantId !== undefined, {
    message: 'At least one of quantity or variantId is required',
  });

export type Cart = z.infer<typeof CartSchema>;
export type CartItem = z.infer<typeof CartItemSchema>;
export type CartProductVariant = z.infer<typeof CartProductVariantSchema>;
export type AddToCartInput = z.infer<typeof AddToCartSchema>;
export type UpdateCartItemInput = z.infer<typeof UpdateCartItemSchema>;
