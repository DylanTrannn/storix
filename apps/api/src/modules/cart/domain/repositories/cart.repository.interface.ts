import type { AddToCartInput, UpdateCartItemInput } from '@storix/shared';
import type { CartEntity } from '../entities/cart.entity';

export const CART_REPOSITORY = Symbol('CART_REPOSITORY');

export interface ICartRepository {
  findByUserId(userId: string): Promise<CartEntity | null>;
  findBySessionId(sessionId: string): Promise<CartEntity | null>;
  createForUser(userId: string): Promise<CartEntity>;
  createForSession(sessionId: string): Promise<CartEntity>;
  addItem(cartId: string, input: AddToCartInput): Promise<CartEntity | null>;
  updateItem(cartId: string, itemId: string, input: UpdateCartItemInput): Promise<CartEntity | null>;
  removeItem(cartId: string, itemId: string): Promise<CartEntity | null>;
  clearCart(cartId: string): Promise<void>;
  mergeCarts(guestCartId: string, userCartId: string): Promise<CartEntity | null>;
  assignCartToUser(cartId: string, userId: string): Promise<void>;
}
