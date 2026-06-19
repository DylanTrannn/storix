import { z } from 'zod';
import { ORDER_STATUSES, PAYMENT_METHODS } from '../constants.js';

export const OrderItemSchema = z.object({
  id: z.string().uuid(),
  orderId: z.string().uuid(),
  variantId: z.string().uuid(),
  productName: z.string(),
  variantName: z.string().optional().nullable(),
  price: z.number().int(),
  quantity: z.number().int().positive(),
});

export const OrderSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid().nullable().optional(),
  guestEmail: z.string().email().nullable().optional(),
  status: z.enum(ORDER_STATUSES),
  paymentMethod: z.enum(PAYMENT_METHODS),
  shippingAddress: z.object({
    line1: z.string(),
    line2: z.string().optional().nullable(),
    city: z.string(),
    state: z.string(),
    postalCode: z.string(),
    country: z.string(),
  }),
  notes: z.string().optional().nullable(),
  subtotal: z.number().int(),
  total: z.number().int(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const OrderDetailSchema = OrderSchema.extend({
  items: z.array(OrderItemSchema),
});

export const CheckoutSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  shippingAddress: z.object({
    line1: z.string().min(1),
    line2: z.string().optional(),
    city: z.string().min(1),
    state: z.string().min(1),
    postalCode: z.string().min(1),
    country: z.string().min(1),
  }),
  paymentMethod: z.enum(PAYMENT_METHODS),
  notes: z.string().optional(),
});

export const UpdateOrderStatusSchema = z.object({
  status: z.enum(ORDER_STATUSES),
});

export type Order = z.infer<typeof OrderSchema>;
export type OrderDetail = z.infer<typeof OrderDetailSchema>;
export type OrderItem = z.infer<typeof OrderItemSchema>;
export type CheckoutInput = z.infer<typeof CheckoutSchema>;
export type UpdateOrderStatusInput = z.infer<typeof UpdateOrderStatusSchema>;
