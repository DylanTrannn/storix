import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  CheckoutInput,
  ConfirmOrderPaymentInput,
  OrderStatus,
  PaginatedResponse,
  PaginationQuery,
} from '@storix/shared';
import { buildTransferReference, checkoutToShippingAddress } from '@storix/shared';
import { CART_REPOSITORY } from '../../cart/domain/repositories/cart.repository.interface';
import type { ICartRepository } from '../../cart/domain/repositories/cart.repository.interface';
import type { OrderEntity } from '../domain/entities/order.entity';
import type { IOrderRepository } from '../domain/repositories/order.repository.interface';
import { ORDER_REPOSITORY } from '../domain/repositories/order.repository.interface';
import { PaymentConfigService } from './payment-config.service';
import { VietQrService } from './vietqr.service';

@Injectable()
export class OrderService {
  constructor(
    @Inject(ORDER_REPOSITORY) private readonly orderRepository: IOrderRepository,
    @Inject(CART_REPOSITORY) private readonly cartRepository: ICartRepository,
    private readonly paymentConfig: PaymentConfigService,
    private readonly vietQrService: VietQrService,
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

    if (input.paymentMethod === 'bank_transfer' && !this.paymentConfig.isBankTransferConfigured()) {
      throw new BadRequestException('Bank transfer is not configured');
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

    const isBankTransfer = input.paymentMethod === 'bank_transfer';
    const config = this.paymentConfig.getConfig();

    const order = await this.orderRepository.create({
      userId,
      guestEmail: input.email,
      paymentMethod: input.paymentMethod,
      paymentStatus: isBankTransfer ? 'pending' : 'not_required',
      shippingAddress: checkoutToShippingAddress(input),
      notes: input.notes,
      subtotal: cart.subtotal,
      total: cart.subtotal,
      items: orderItems,
    });

    await this.cartRepository.clearCart(cart.id);

    if (isBankTransfer) {
      const transferReference = buildTransferReference(config.storeName, order.orderNumber);
      const updated = await this.orderRepository.updateTransferReference(
        order.id,
        transferReference,
      );
      return (updated ?? order).toDetail();
    }

    return order.toDetail();
  }

  async getMyOrders(userId: string, query: PaginationQuery): Promise<PaginatedResponse<ReturnType<OrderEntity['toDetail']>>> {
    const result = await this.orderRepository.findByUserId(userId, query);
    return {
      data: result.data.map((o) => o.toDetail()),
      meta: result.meta,
    };
  }

  private assertOrderAccess(order: OrderEntity, userId?: string, role?: string): void {
    // Guest checkout orders (no userId) are accessible via direct link
    if (!order.userId) {
      return;
    }
    if (role === 'admin') {
      return;
    }
    if (!userId || order.userId !== userId) {
      throw new NotFoundException('Order not found');
    }
  }

  async getById(id: string, userId?: string, role?: string) {
    const order = await this.orderRepository.findById(id);
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    this.assertOrderAccess(order, userId, role);
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

  async getPaymentInstructions(id: string, userId?: string, role?: string) {
    const order = await this.orderRepository.findById(id);
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    this.assertOrderAccess(order, userId, role);
    if (order.paymentMethod !== 'bank_transfer') {
      throw new BadRequestException('Order does not use bank transfer');
    }

    const config = this.paymentConfig.getConfig();
    const amount = this.paymentConfig.toPaymentAmount(order.total);
    const transferReference =
      order.transferReference ??
      buildTransferReference(config.storeName, order.orderNumber);

    const qrResult = await this.vietQrService.generateOrderQr(transferReference, amount);
    const bankConfigured = this.paymentConfig.isBankTransferConfigured();
    const qrDataUrl =
      qrResult.qrDataUrl ?? (bankConfigured ? null : config.staticQrUrl);

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      transferReference,
      amount,
      currency: config.currency,
      bankName: config.bankName,
      bankBin: config.bankBin,
      accountNumber: config.accountNumber,
      accountHolder: config.accountHolder,
      qrDataUrl,
      qrAvailable: Boolean(qrDataUrl),
      bankConfigured,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      payPageUrl: `${config.appUrl}/orders/${order.id}/pay`,
      deadlineHours: config.deadlineHours,
    };
  }

  async markPaymentSubmitted(id: string, userId?: string, role?: string) {
    const order = await this.orderRepository.findById(id);
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    this.assertOrderAccess(order, userId, role);
    if (order.paymentMethod !== 'bank_transfer') {
      throw new BadRequestException('Order does not use bank transfer');
    }
    if (order.paymentStatus === 'confirmed') {
      throw new BadRequestException('Payment already confirmed');
    }
    if (order.paymentStatus === 'awaiting_review') {
      return order.toDetail();
    }

    const updated = await this.orderRepository.markPaymentSubmitted(id);
    if (!updated) {
      throw new NotFoundException('Order not found');
    }
    return updated.toDetail();
  }

  async confirmPayment(id: string, input: ConfirmOrderPaymentInput) {
    const order = await this.orderRepository.findById(id);
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    if (order.paymentMethod !== 'bank_transfer') {
      throw new BadRequestException('Order does not use bank transfer');
    }
    if (order.paymentStatus === 'confirmed') {
      throw new BadRequestException('Payment already confirmed');
    }

    const updated = await this.orderRepository.confirmPayment(id, input.confirmed);
    if (!updated) {
      throw new NotFoundException('Order not found');
    }
    return updated.toDetail();
  }
}
