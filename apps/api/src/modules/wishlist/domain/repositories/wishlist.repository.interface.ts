import type { WishlistItemEntity } from '../entities/wishlist-item.entity';

export const WISHLIST_REPOSITORY = Symbol('WISHLIST_REPOSITORY');

export interface IWishlistRepository {
  findByUserId(userId: string): Promise<WishlistItemEntity[]>;
  add(userId: string, productId: string): Promise<WishlistItemEntity>;
  remove(userId: string, productId: string): Promise<boolean>;
  exists(userId: string, productId: string): Promise<boolean>;
}
