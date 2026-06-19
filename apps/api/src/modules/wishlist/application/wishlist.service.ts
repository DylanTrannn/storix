import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { AddToWishlistInput } from '@storix/shared';
import type { IWishlistRepository } from '../domain/repositories/wishlist.repository.interface';
import { WISHLIST_REPOSITORY } from '../domain/repositories/wishlist.repository.interface';

@Injectable()
export class WishlistService {
  constructor(
    @Inject(WISHLIST_REPOSITORY) private readonly wishlistRepository: IWishlistRepository,
  ) {}

  async getWishlist(userId: string) {
    const items = await this.wishlistRepository.findByUserId(userId);
    return {
      items: items.map((item) => ({
        id: item.id,
        userId: item.userId,
        productId: item.productId,
        product: item.product,
        createdAt: item.createdAt,
      })),
    };
  }

  async addItem(userId: string, input: AddToWishlistInput) {
    const item = await this.wishlistRepository.add(userId, input.productId);
    return {
      id: item.id,
      userId: item.userId,
      productId: item.productId,
      product: item.product,
      createdAt: item.createdAt,
    };
  }

  async removeItem(userId: string, productId: string) {
    const removed = await this.wishlistRepository.remove(userId, productId);
    if (!removed) {
      throw new NotFoundException('Wishlist item not found');
    }
  }
}
