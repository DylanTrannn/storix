import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq, inArray } from 'drizzle-orm';
import type { AddToCartInput, UpdateCartItemInput } from '@storix/shared';
import { resolveVariantDisplayImage } from '@storix/shared';
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
import {
  InsufficientInventoryError,
  InvalidVariantChangeError,
} from '../domain/errors/cart.errors';

@Injectable()
export class CartRepository implements ICartRepository {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

  private async loadProductVariantsByProductId(productIds: string[]) {
    if (productIds.length === 0) return new Map<string, typeof productVariants.$inferSelect[]>();

    const rows = await this.db
      .select()
      .from(productVariants)
      .where(inArray(productVariants.productId, productIds));

    const map = new Map<string, typeof productVariants.$inferSelect[]>();
    for (const id of productIds) {
      map.set(id, []);
    }
    for (const row of rows) {
      map.get(row.productId)?.push(row);
    }
    return map;
  }

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

    const imagesByProduct = new Map<string, typeof productImagesRows>();
    for (const id of productIds) {
      imagesByProduct.set(id, []);
    }
    for (const image of productImagesRows) {
      imagesByProduct.get(image.productId)?.push(image);
    }

    const variantsByProduct = await this.loadProductVariantsByProductId(productIds);

    const cartItemEntities = items.map(({ item, variant, product }) => {
      const productImageList = (imagesByProduct.get(product.id) ?? []).map((img) => ({
        url: img.url,
        linkedOptions: img.linkedOptions ?? null,
        alt: img.alt,
      }));
      const allVariants = variantsByProduct.get(product.id) ?? [];
      const variantLikes = allVariants.map((v) => ({
        id: v.id,
        options: v.options ?? {},
        inventory: v.inventory,
        imageUrl: v.imageUrl,
      }));

      const resolvedImageUrl = resolveVariantDisplayImage(
        {
          id: variant.id,
          options: variant.options ?? {},
          inventory: variant.inventory,
          imageUrl: variant.imageUrl,
        },
        productImageList,
        variantLikes,
        product.mediaOptionName,
      );

      const productVariantsPayload = allVariants.map((v) => ({
        id: v.id,
        options: v.options ?? {},
        price: v.price,
        inventory: v.inventory,
        imageUrl: resolveVariantDisplayImage(
          {
            id: v.id,
            options: v.options ?? {},
            inventory: v.inventory,
            imageUrl: v.imageUrl,
          },
          productImageList,
          variantLikes,
          product.mediaOptionName,
        ),
      }));

      return new CartItemEntity(
        item.id,
        item.cartId,
        item.variantId,
        item.quantity,
        {
          id: variant.id,
          sku: variant.sku,
          price: variant.price,
          inventory: variant.inventory,
          options: variant.options ?? {},
          imageUrl: resolvedImageUrl,
          product: { id: product.id, name: product.name, slug: product.slug },
        },
        productVariantsPayload,
      );
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

  private async getVariantById(variantId: string) {
    const [row] = await this.db
      .select()
      .from(productVariants)
      .where(eq(productVariants.id, variantId))
      .limit(1);
    return row ?? null;
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
    const variant = await this.getVariantById(input.variantId);
    if (!variant) {
      throw new InvalidVariantChangeError('Variant not found');
    }

    const [existing] = await this.db
      .select()
      .from(cartItems)
      .where(and(eq(cartItems.cartId, cartId), eq(cartItems.variantId, input.variantId)))
      .limit(1);

    const nextQuantity = (existing?.quantity ?? 0) + input.quantity;
    if (nextQuantity > variant.inventory) {
      throw new InsufficientInventoryError(
        `Only ${variant.inventory} item(s) available in stock`,
      );
    }

    if (existing) {
      await this.db
        .update(cartItems)
        .set({ quantity: nextQuantity })
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
    const [currentItem] = await this.db
      .select({
        item: cartItems,
        variant: productVariants,
      })
      .from(cartItems)
      .innerJoin(productVariants, eq(cartItems.variantId, productVariants.id))
      .where(and(eq(cartItems.id, itemId), eq(cartItems.cartId, cartId)))
      .limit(1);

    if (!currentItem) return null;

    const targetVariantId = input.variantId ?? currentItem.item.variantId;
    const targetQuantity = input.quantity ?? currentItem.item.quantity;

    if (input.variantId && input.variantId !== currentItem.item.variantId) {
      const newVariant = await this.getVariantById(input.variantId);
      if (!newVariant) {
        throw new InvalidVariantChangeError('Variant not found');
      }
      if (newVariant.productId !== currentItem.variant.productId) {
        throw new InvalidVariantChangeError('Variant must belong to the same product');
      }

      const [existingTarget] = await this.db
        .select()
        .from(cartItems)
        .where(
          and(
            eq(cartItems.cartId, cartId),
            eq(cartItems.variantId, input.variantId),
          ),
        )
        .limit(1);

      if (existingTarget && existingTarget.id !== itemId) {
        const mergedQuantity = existingTarget.quantity + targetQuantity;
        if (mergedQuantity > newVariant.inventory) {
          throw new InsufficientInventoryError(
            `Only ${newVariant.inventory} item(s) available in stock`,
          );
        }
        await this.db
          .update(cartItems)
          .set({ quantity: mergedQuantity })
          .where(eq(cartItems.id, existingTarget.id));
        await this.db
          .delete(cartItems)
          .where(and(eq(cartItems.id, itemId), eq(cartItems.cartId, cartId)));
      } else {
        if (targetQuantity > newVariant.inventory) {
          throw new InsufficientInventoryError(
            `Only ${newVariant.inventory} item(s) available in stock`,
          );
        }
        await this.db
          .update(cartItems)
          .set({
            variantId: input.variantId,
            ...(input.quantity !== undefined ? { quantity: input.quantity } : {}),
          })
          .where(and(eq(cartItems.id, itemId), eq(cartItems.cartId, cartId)));
      }
    } else if (input.quantity !== undefined) {
      const variant = await this.getVariantById(currentItem.item.variantId);
      if (!variant) {
        throw new InvalidVariantChangeError('Variant not found');
      }
      if (input.quantity > variant.inventory) {
        throw new InsufficientInventoryError(
          `Only ${variant.inventory} item(s) available in stock`,
        );
      }
      await this.db
        .update(cartItems)
        .set({ quantity: input.quantity })
        .where(and(eq(cartItems.id, itemId), eq(cartItems.cartId, cartId)));
    }

    await this.db.update(carts).set({ updatedAt: new Date() }).where(eq(carts.id, cartId));
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
