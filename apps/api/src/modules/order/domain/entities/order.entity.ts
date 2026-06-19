import type { OrderStatus, PaymentMethod } from '@storix/shared';

export class OrderItemEntity {
  constructor(
    public readonly id: string,
    public readonly orderId: string,
    public readonly variantId: string,
    public readonly productName: string,
    public readonly variantName: string | null,
    public readonly price: number,
    public readonly quantity: number,
  ) {}
}

export class OrderEntity {
  constructor(
    public readonly id: string,
    public readonly userId: string | null,
    public readonly guestEmail: string | null,
    public readonly status: OrderStatus,
    public readonly paymentMethod: PaymentMethod,
    public readonly shippingAddress: {
      line1: string;
      line2?: string | null;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    },
    public readonly notes: string | null,
    public readonly subtotal: number,
    public readonly total: number,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly items: OrderItemEntity[] = [],
  ) {}

  toPublic() {
    return {
      id: this.id,
      userId: this.userId,
      guestEmail: this.guestEmail,
      status: this.status,
      paymentMethod: this.paymentMethod,
      shippingAddress: this.shippingAddress,
      notes: this.notes,
      subtotal: this.subtotal,
      total: this.total,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  toDetail() {
    return {
      ...this.toPublic(),
      items: this.items.map((item) => ({
        id: item.id,
        orderId: item.orderId,
        variantId: item.variantId,
        productName: item.productName,
        variantName: item.variantName,
        price: item.price,
        quantity: item.quantity,
      })),
    };
  }
}
