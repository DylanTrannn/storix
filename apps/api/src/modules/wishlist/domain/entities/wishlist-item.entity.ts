export class WishlistItemEntity {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly productId: string,
    public readonly createdAt: Date,
    public readonly product?: {
      id: string;
      name: string;
      slug: string;
      imageUrl: string | null;
      minPrice?: number;
    },
  ) {}
}
