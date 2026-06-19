import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq, inArray } from 'drizzle-orm';
import type { AddToCartInput, UpdateCartItemInput } from '@storix/shared';
import { DATABASE_CONNECTION, type Database } from '@/infrastructure/database/database.provider';
import {
  cartItems,
  carts,
  products,
  productVariants,
  productImages,
} from '@/infrastructure/database/schema';
import { CartEntity, CartItemEntity } from '../domain/entities/cart.entity';
import type { ICartRepository } from '../domain/repositories/cart.repository.interface';
import { CART_REPOSITORY } from '../domain/repositories/cart.repository.interface';

@Injectable()
export class CartRepository implements ICartRepository {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

  private async loadCart(cartRow: typeof carts.$inferSelect): Promise<CartEntity> {
    const items = await this.db
      .select({
        item: cartItems,
        variant: productVariants,
        product: products,
      })
      .from(cartItems)
      .innerJoin(productVariants, eq(cartItems.variantId, productVariants.id))
      .innerJoin(products, eq(productVariants.productId, products.id))
      .where(eq(cartItems.cartId, cartRow.id));

    const productIds = [...new Set(items.map(({ product }) => product.id))];
    const productImagesRows =
      productIds.length > 0
        ? await this.db
            .select()
            .from(productImages)
            .where(inArray(productImages.productId, productIds))
            .orderBy(asc(productImages.sortOrder))
        : [];

    const primaryImageByProduct = new Map<string, string>();
    for (const image of productImagesRows) {
      if (!primaryImageByProduct.has(image.productId)) {
        primaryImageByProduct.set(image.productId, image.url);
      }
    }

    const cartItemEntities = items.map(({ item, variant, product }) => {
      const resolvedImageUrl =
        variant.imageUrl ?? primaryImageByProduct.get(product.id) ?? null;

      return new CartItemEntity(item.id, item.cartId, item.variantId, item.quantity, {
        id: variant.id,
        sku: variant.sku,
        price: variant.price,
        inventory: variant.inventory,
        options: variant.options ?? {},
        imageUrl: resolvedImageUrl,
        product: { id: product.id, name: product.name, slug: product.slug },
      });
    });

    const subtotal = cartItemEntities.reduce(
      (sum, item) => sum + (item.variant?.price ?? 0) * item.quantity,
      0,
    );
    const itemCount = cartItemEntities.reduce((sum, item) => sum + item.quantity, 0);

    return new CartEntity(
      cartRow.id,
      cartRow.userId,
      cartRow.sessionId,
      cartItemEntities,
      subtotal,
      itemCount,
    );
  }

  async findByUserId(userId: string): Promise<CartEntity | null> {
    const [row] = await this.db.select().from(carts).where(eq(carts.userId, userId)).limit(1);
    return row ? this.loadCart(row) : null;
  }

  async findBySessionId(sessionId: string): Promise<CartEntity | null> {
    const [row] = await this.db
      .select()
      .from(carts)
      .where(eq(carts.sessionId, sessionId))
      .limit(1);
    return row ? this.loadCart(row) : null;
  }

  async createForUser(userId: string): Promise<CartEntity> {
    const [row] = await this.db.insert(carts).values({ userId }).returning();
    return this.loadCart(row);
  }

  async createForSession(sessionId: string): Promise<CartEntity> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    const [row] = await this.db
      .insert(carts)
      .values({ sessionId, expiresAt })
      .returning();
    return this.loadCart(row);
  }

  async addItem(cartId: string, input: AddToCartInput): Promise<CartEntity | null> {
    const [existing] = await this.db
      .select()
      .from(cartItems)
      .where(and(eq(cartItems.cartId, cartId), eq(cartItems.variantId, input.variantId)))
      .limit(1);

    if (existing) {
      await this.db
        .update(cartItems)
        .set({ quantity: existing.quantity + input.quantity })
        .where(eq(cartItems.id, existing.id));
    } else {
      await this.db.insert(cartItems).values({
        cartId,
        variantId: input.variantId,
        quantity: input.quantity,
      });
    }

    await this.db.update(carts).set({ updatedAt: new Date() }).where(eq(carts.id, cartId));
    const [cartRow] = await this.db.select().from(carts).where(eq(carts.id, cartId)).limit(1);
    return cartRow ? this.loadCart(cartRow) : null;
  }

  async updateItem(
    cartId: string,
    itemId: string,
    input: UpdateCartItemInput,
  ): Promise<CartEntity | null> {
    await this.db
      .update(cartItems)
      .set({ quantity: input.quantity })
      .where(and(eq(cartItems.id, itemId), eq(cartItems.cartId, cartId)));
    const [cartRow] = await this.db.select().from(carts).where(eq(carts.id, cartId)).limit(1);
    return cartRow ? this.loadCart(cartRow) : null;
  }

  async removeItem(cartId: string, itemId: string): Promise<CartEntity | null> {
    await this.db
      .delete(cartItems)
      .where(and(eq(cartItems.id, itemId), eq(cartItems.cartId, cartId)));
    const [cartRow] = await this.db.select().from(carts).where(eq(carts.id, cartId)).limit(1);
    return cartRow ? this.loadCart(cartRow) : null;
  }

  async clearCart(cartId: string): Promise<void> {
    await this.db.delete(cartItems).where(eq(cartItems.cartId, cartId));
  }

  async mergeCarts(guestCartId: string, userCartId: string): Promise<CartEntity | null> {
    const guestItems = await this.db
      .select()
      .from(cartItems)
      .where(eq(cartItems.cartId, guestCartId));

    for (const item of guestItems) {
      await this.addItem(userCartId, { variantId: item.variantId, quantity: item.quantity });
    }

    await this.db.delete(carts).where(eq(carts.id, guestCartId));
    const [cartRow] = await this.db.select().from(carts).where(eq(carts.id, userCartId)).limit(1);
    return cartRow ? this.loadCart(cartRow) : null;
  }

  async assignCartToUser(cartId: string, userId: string): Promise<void> {
    await this.db
      .update(carts)
      .set({ userId, sessionId: null, updatedAt: new Date() })
      .where(eq(carts.id, cartId));
  }
}

export { CART_REPOSITORY };
