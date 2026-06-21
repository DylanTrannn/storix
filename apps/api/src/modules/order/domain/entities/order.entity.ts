import type { OrderStatus, PaymentMethod, PaymentStatus, ShippingAddress } from '@storix/shared';

export class OrderItemEntity {
  constructor(
    public readonly id: string,
    public readonly orderId: string,
    public readonly variantId: string,
    public readonly productName: string,
    public readonly variantName: string | null,
    public readonly price: number,
    public readonly quantity: number,
    public readonly productSlug: string | null = null,
    public readonly imageUrl: string | null = null,
  ) {}
}

export class OrderEntity {
  constructor(
    public readonly id: string,
    public readonly orderNumber: number,
    public readonly userId: string | null,
    public readonly guestEmail: string | null,
    public readonly status: OrderStatus,
    public readonly paymentStatus: PaymentStatus,
    public readonly paymentMethod: PaymentMethod,
    public readonly transferReference: string | null,
    public readonly customerMarkedPaidAt: Date | null,
    public readonly paymentConfirmedAt: Date | null,
    public readonly shippingAddress: ShippingAddress,
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
      orderNumber: this.orderNumber,
      userId: this.userId,
      guestEmail: this.guestEmail,
      status: this.status,
      paymentStatus: this.paymentStatus,
      paymentMethod: this.paymentMethod,
      transferReference: this.transferReference,
      customerMarkedPaidAt: this.customerMarkedPaidAt,
      paymentConfirmedAt: this.paymentConfirmedAt,
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
        productSlug: item.productSlug,
        variantName: item.variantName,
        imageUrl: item.imageUrl,
        price: item.price,
        quantity: item.quantity,
      })),
    };
  }
}
