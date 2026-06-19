import type {
  CheckoutInput,
  OrderStatus,
  PaginatedResponse,
  PaginationQuery,
} from '@storix/shared';
import type { OrderEntity } from '../entities/order.entity';

export const ORDER_REPOSITORY = Symbol('ORDER_REPOSITORY');

export interface CreateOrderData {
  userId?: string;
  guestEmail: string;
  paymentMethod: CheckoutInput['paymentMethod'];
  shippingAddress: CheckoutInput['shippingAddress'];
  notes?: string;
  subtotal: number;
  total: number;
  items: Array<{
    variantId: string;
    productName: string;
    variantName?: string;
    price: number;
    quantity: number;
  }>;
}

export interface IOrderRepository {
  findById(id: string): Promise<OrderEntity | null>;
  findByUserId(userId: string, query: PaginationQuery): Promise<PaginatedResponse<OrderEntity>>;
  list(query: PaginationQuery): Promise<PaginatedResponse<OrderEntity>>;
  create(data: CreateOrderData): Promise<OrderEntity>;
  updateStatus(id: string, status: OrderStatus): Promise<OrderEntity | null>;
}
