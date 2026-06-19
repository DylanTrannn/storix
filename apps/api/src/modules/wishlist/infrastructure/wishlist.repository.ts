import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq, min } from 'drizzle-orm';
import { DATABASE_CONNECTION, type Database } from '@/infrastructure/database/database.provider';
import {
  productImages,
  products,
  productVariants,
  wishlistItems,
} from '@/infrastructure/database/schema';
import { WishlistItemEntity } from '../domain/entities/wishlist-item.entity';
import type { IWishlistRepository } from '../domain/repositories/wishlist.repository.interface';
import { WISHLIST_REPOSITORY } from '../domain/repositories/wishlist.repository.interface';

@Injectable()
export class WishlistRepository implements IWishlistRepository {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

  private async toEntity(row: typeof wishlistItems.$inferSelect): Promise<WishlistItemEntity> {
    const [product] = await this.db
      .select()
      .from(products)
      .where(eq(products.id, row.productId))
      .limit(1);

    const [image] = await this.db
      .select()
      .from(productImages)
      .where(eq(productImages.productId, row.productId))
      .orderBy(asc(productImages.sortOrder))
      .limit(1);

    const [priceRow] = await this.db
      .select({ minPrice: min(productVariants.price) })
      .from(productVariants)
      .where(eq(productVariants.productId, row.productId));

    return new WishlistItemEntity(
      row.id,
      row.userId,
      row.productId,
      row.createdAt,
      product
        ? {
            id: product.id,
            name: product.name,
            slug: product.slug,
            imageUrl: image?.url ?? null,
            minPrice: priceRow?.minPrice ?? undefined,
          }
        : undefined,
    );
  }

  async findByUserId(userId: string): Promise<WishlistItemEntity[]> {
    const rows = await this.db
      .select()
      .from(wishlistItems)
      .where(eq(wishlistItems.userId, userId))
      .orderBy(wishlistItems.createdAt);
    return Promise.all(rows.map((row) => this.toEntity(row)));
  }

  async add(userId: string, productId: string): Promise<WishlistItemEntity> {
    const [existing] = await this.db
      .select()
      .from(wishlistItems)
      .where(and(eq(wishlistItems.userId, userId), eq(wishlistItems.productId, productId)))
      .limit(1);

    if (existing) {
      return this.toEntity(existing);
    }

    const [row] = await this.db.insert(wishlistItems).values({ userId, productId }).returning();
    return this.toEntity(row);
  }

  async remove(userId: string, productId: string): Promise<boolean> {
    const result = await this.db
      .delete(wishlistItems)
      .where(and(eq(wishlistItems.userId, userId), eq(wishlistItems.productId, productId)))
      .returning();
    return result.length > 0;
  }

  async exists(userId: string, productId: string): Promise<boolean> {
    const [row] = await this.db
      .select({ id: wishlistItems.id })
      .from(wishlistItems)
      .where(and(eq(wishlistItems.userId, userId), eq(wishlistItems.productId, productId)))
      .limit(1);
    return !!row;
  }
}

export { WISHLIST_REPOSITORY };
