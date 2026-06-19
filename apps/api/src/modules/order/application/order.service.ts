import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  CheckoutInput,
  OrderStatus,
  PaginatedResponse,
  PaginationQuery,
} from '@storix/shared';
import { CART_REPOSITORY } from '../../cart/domain/repositories/cart.repository.interface';
import type { ICartRepository } from '../../cart/domain/repositories/cart.repository.interface';
import type { OrderEntity } from '../domain/entities/order.entity';
import type { IOrderRepository } from '../domain/repositories/order.repository.interface';
import { ORDER_REPOSITORY } from '../domain/repositories/order.repository.interface';

@Injectable()
export class OrderService {
  constructor(
    @Inject(ORDER_REPOSITORY) private readonly orderRepository: IOrderRepository,
    @Inject(CART_REPOSITORY) private readonly cartRepository: ICartRepository,
  ) {}

  async checkout(
    input: CheckoutInput,
    userId?: string,
    sessionId?: string,
  ) {
    let cart = userId
      ? await this.cartRepository.findByUserId(userId)
      : sessionId
        ? await this.cartRepository.findBySessionId(sessionId)
        : null;

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    const orderItems = cart.items.map((item) => {
      if (!item.variant) {
        throw new BadRequestException('Invalid cart item');
      }
      const variantName = Object.values(item.variant.options).join(' / ') || undefined;
      return {
        variantId: item.variantId,
        productName: item.variant.product.name,
        variantName,
        price: item.variant.price,
        quantity: item.quantity,
      };
    });

    const order = await this.orderRepository.create({
      userId,
      guestEmail: input.email,
      paymentMethod: input.paymentMethod,
      shippingAddress: input.shippingAddress,
      notes: input.notes,
      subtotal: cart.subtotal,
      total: cart.subtotal,
      items: orderItems,
    });

    await this.cartRepository.clearCart(cart.id);

    return order.toDetail();
  }

  async getMyOrders(userId: string, query: PaginationQuery): Promise<PaginatedResponse<ReturnType<OrderEntity['toDetail']>>> {
    const result = await this.orderRepository.findByUserId(userId, query);
    return {
      data: result.data.map((o) => o.toDetail()),
      meta: result.meta,
    };
  }

  async getById(id: string, userId?: string) {
    const order = await this.orderRepository.findById(id);
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    if (userId && order.userId !== userId) {
      throw new NotFoundException('Order not found');
    }
    return order.toDetail();
  }

  async listAll(query: PaginationQuery): Promise<PaginatedResponse<ReturnType<OrderEntity['toDetail']>>> {
    const result = await this.orderRepository.list(query);
    return {
      data: result.data.map((o) => o.toDetail()),
      meta: result.meta,
    };
  }

  async updateStatus(id: string, status: OrderStatus) {
    const order = await this.orderRepository.updateStatus(id, status);
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return order.toDetail();
  }
}
