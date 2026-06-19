export class CartItemEntity {
  constructor(
    public readonly id: string,
    public readonly cartId: string,
    public readonly variantId: string,
    public readonly quantity: number,
    public readonly variant?: {
      id: string;
      sku: string;
      price: number;
      inventory: number;
      options: Record<string, string>;
      imageUrl: string | null;
      product: { id: string; name: string; slug: string };
    },
  ) {}
}

export class CartEntity {
  constructor(
    public readonly id: string,
    public readonly userId: string | null,
    public readonly sessionId: string | null,
    public readonly items: CartItemEntity[],
    public readonly subtotal: number,
    public readonly itemCount: number,
  ) {}

  toPublic() {
    return {
      id: this.id,
      userId: this.userId,
      sessionId: this.sessionId,
      items: this.items.map((item) => ({
        id: item.id,
        cartId: item.cartId,
        variantId: item.variantId,
        quantity: item.quantity,
        variant: item.variant,
      })),
      subtotal: this.subtotal,
      itemCount: this.itemCount,
    };
  }
}
