import { z } from 'zod';
import { ORDER_STATUSES, PAYMENT_METHODS, PAYMENT_STATUSES } from '../constants.js';
import { VN_PROVINCES } from '../data/vn-provinces.js';

export const ShippingAddressSchema = z.object({
  line1: z.string(),
  line2: z.string().optional().nullable(),
  city: z.string(),
  state: z.string().optional().nullable(),
  postalCode: z.string().optional().nullable(),
  country: z.string(),
  phone: z.string().optional().nullable(),
  recipientName: z.string().optional().nullable(),
});

export const OrderItemSchema = z.object({
  id: z.string().uuid(),
  orderId: z.string().uuid(),
  variantId: z.string().uuid(),
  productName: z.string(),
  productSlug: z.string().nullable().optional(),
  variantName: z.string().optional().nullable(),
  imageUrl: z.string().nullable().optional(),
  price: z.number().int(),
  quantity: z.number().int().positive(),
});

export const OrderSchema = z.object({
  id: z.string().uuid(),
  orderNumber: z.number().int().positive(),
  userId: z.string().uuid().nullable().optional(),
  guestEmail: z.string().email().nullable().optional(),
  status: z.enum(ORDER_STATUSES),
  paymentStatus: z.enum(PAYMENT_STATUSES),
  paymentMethod: z.enum(PAYMENT_METHODS),
  transferReference: z.string().nullable().optional(),
  customerMarkedPaidAt: z.coerce.date().nullable().optional(),
  paymentConfirmedAt: z.coerce.date().nullable().optional(),
  shippingAddress: ShippingAddressSchema,
  notes: z.string().optional().nullable(),
  subtotal: z.number().int(),
  total: z.number().int(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const OrderDetailSchema = OrderSchema.extend({
  items: z.array(OrderItemSchema),
});

const vnPhoneRegex = /^0(3|5|7|8|9)\d{8}$/;

export const CheckoutShippingSchema = z.object({
  street: z.string().min(5, 'Vui lòng nhập số nhà, tên đường'),
  ward: z.string().min(2, 'Vui lòng nhập phường/xã'),
  province: z.enum(VN_PROVINCES, {
    errorMap: () => ({ message: 'Vui lòng chọn tỉnh/thành phố' }),
  }),
});

export const CheckoutSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  phone: z
    .string()
    .regex(vnPhoneRegex, 'Số điện thoại không hợp lệ (vd: 0901234567)'),
  fullName: z.string().min(2, 'Vui lòng nhập họ và tên'),
  shippingAddress: CheckoutShippingSchema,
  paymentMethod: z.enum(PAYMENT_METHODS),
  notes: z.string().optional(),
});

export const UpdateOrderStatusSchema = z.object({
  status: z.enum(ORDER_STATUSES),
});

export const ConfirmOrderPaymentSchema = z.object({
  confirmed: z.boolean(),
  reason: z.string().optional(),
});

export type Order = z.infer<typeof OrderSchema>;
export type OrderDetail = z.infer<typeof OrderDetailSchema>;
export type OrderItem = z.infer<typeof OrderItemSchema>;
export type ShippingAddress = z.infer<typeof ShippingAddressSchema>;
export type CheckoutInput = z.infer<typeof CheckoutSchema>;
export type UpdateOrderStatusInput = z.infer<typeof UpdateOrderStatusSchema>;
export type ConfirmOrderPaymentInput = z.infer<typeof ConfirmOrderPaymentSchema>;

export function buildTransferReference(storeName: string, orderNumber: number): string {
  return `${storeName.trim().toUpperCase()} ${orderNumber}`;
}

/** Map VN checkout form → persisted shipping address (jsonb) */
export function checkoutToShippingAddress(input: CheckoutInput): ShippingAddress {
  return {
    line1: input.shippingAddress.street.trim(),
    line2: input.shippingAddress.ward.trim(),
    city: input.shippingAddress.province,
    state: null,
    postalCode: null,
    country: 'VN',
    phone: input.phone.trim(),
    recipientName: input.fullName.trim(),
  };
}

/** Format shipping address for display in Vietnam */
export function formatVnShippingAddress(address: ShippingAddress): string {
  const parts = [
    address.line1,
    address.line2,
    address.city,
  ].filter(Boolean);
  return parts.join(', ');
}
