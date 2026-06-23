import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type Redis from 'ioredis';
import type { AddToCartInput, UpdateCartItemInput } from '@storix/shared';
import { randomUUID } from 'crypto';
import { REDIS_CLIENT } from '@/infrastructure/redis/redis.provider';
import type { CartEntity } from '../domain/entities/cart.entity';
import type { ICartRepository } from '../domain/repositories/cart.repository.interface';
import { CART_REPOSITORY } from '../domain/repositories/cart.repository.interface';
import {
  InsufficientInventoryError,
  InvalidVariantChangeError,
} from '../domain/errors/cart.errors';

const CART_CACHE_TTL = 60 * 60;
export const SESSION_COOKIE = 'cart_session_id';

@Injectable()
export class CartService {
  constructor(
    @Inject(CART_REPOSITORY) private readonly cartRepository: ICartRepository,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  private cacheKey(cartId: string) {
    return `cart:${cartId}`;
  }

  private async cacheCart(cart: ReturnType<CartEntity['toPublic']>) {
    await this.redis.setex(this.cacheKey(cart.id), CART_CACHE_TTL, JSON.stringify(cart));
  }

  private async invalidateCache(cartId: string) {
    await this.redis.del(this.cacheKey(cartId));
  }

  async getOrCreateCart(userId?: string, sessionId?: string) {
    if (userId) {
      let cart = await this.cartRepository.findByUserId(userId);
      if (!cart) {
        cart = await this.cartRepository.createForUser(userId);
      }
      const publicCart = cart.toPublic();
      await this.cacheCart(publicCart);
      return { cart: publicCart, sessionId: null as string | null };
    }

    const sid = sessionId ?? randomUUID();
    let cart = sessionId ? await this.cartRepository.findBySessionId(sessionId) : null;
    if (!cart) {
      cart = await this.cartRepository.createForSession(sid);
    }
    const publicCart = cart.toPublic();
    await this.cacheCart(publicCart);
    return { cart: publicCart, sessionId: sid };
  }

  async addItem(userId: string | undefined, sessionId: string | undefined, input: AddToCartInput) {
    const { cart } = await this.getOrCreateCart(userId, sessionId);
    try {
      const updated = await this.cartRepository.addItem(cart.id, input);
      if (!updated) {
        throw new NotFoundException('Cart not found');
      }
      const publicCart = updated.toPublic();
      await this.cacheCart(publicCart);
      return publicCart;
    } catch (error) {
      if (error instanceof InsufficientInventoryError || error instanceof InvalidVariantChangeError) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  async updateItem(
    userId: string | undefined,
    sessionId: string | undefined,
    itemId: string,
    input: UpdateCartItemInput,
  ) {
    const { cart } = await this.getOrCreateCart(userId, sessionId);
    try {
      const updated = await this.cartRepository.updateItem(cart.id, itemId, input);
      if (!updated) {
        throw new NotFoundException('Cart item not found');
      }
      const publicCart = updated.toPublic();
      await this.cacheCart(publicCart);
      return publicCart;
    } catch (error) {
      if (error instanceof InsufficientInventoryError || error instanceof InvalidVariantChangeError) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  async removeItem(userId: string | undefined, sessionId: string | undefined, itemId: string) {
    const { cart } = await this.getOrCreateCart(userId, sessionId);
    const updated = await this.cartRepository.removeItem(cart.id, itemId);
    if (!updated) {
      throw new NotFoundException('Cart item not found');
    }
    const publicCart = updated.toPublic();
    await this.cacheCart(publicCart);
    return publicCart;
  }

  async mergeGuestCartOnLogin(userId: string, sessionId?: string) {
    if (!sessionId) return;

    const guestCart = await this.cartRepository.findBySessionId(sessionId);
    if (!guestCart || guestCart.items.length === 0) return;

    let userCart = await this.cartRepository.findByUserId(userId);
    if (!userCart) {
      userCart = await this.cartRepository.createForUser(userId);
    }

    await this.cartRepository.mergeCarts(guestCart.id, userCart.id);
    await this.invalidateCache(guestCart.id);
    await this.invalidateCache(userCart.id);
  }
}
