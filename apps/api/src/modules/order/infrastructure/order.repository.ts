import { Inject, Injectable } from '@nestjs/common';
import { count, desc, eq } from 'drizzle-orm';
import type {
  OrderStatus,
  PaginatedResponse,
  PaginationQuery,
} from '@storix/shared';
import { DATABASE_CONNECTION, type Database } from '@/infrastructure/database/database.provider';
import { orderItems, orders } from '@/infrastructure/database/schema';
import { OrderEntity, OrderItemEntity } from '../domain/entities/order.entity';
import type {
  CreateOrderData,
  IOrderRepository,
} from '../domain/repositories/order.repository.interface';
import { ORDER_REPOSITORY } from '../domain/repositories/order.repository.interface';

@Injectable()
export class OrderRepository implements IOrderRepository {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

  private async loadOrder(orderRow: typeof orders.$inferSelect): Promise<OrderEntity> {
    const items = await this.db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, orderRow.id));

    const itemEntities = items.map(
      (item) =>
        new OrderItemEntity(
          item.id,
          item.orderId,
          item.variantId,
          item.productName,
          item.variantName,
          item.price,
          item.quantity,
        ),
    );

    return new OrderEntity(
      orderRow.id,
      orderRow.userId,
      orderRow.guestEmail,
      orderRow.status,
      orderRow.paymentMethod,
      orderRow.shippingAddress,
      orderRow.notes,
      orderRow.subtotal,
      orderRow.total,
      orderRow.createdAt,
      orderRow.updatedAt,
      itemEntities,
    );
  }

  async findById(id: string): Promise<OrderEntity | null> {
    const [row] = await this.db.select().from(orders).where(eq(orders.id, id)).limit(1);
    return row ? this.loadOrder(row) : null;
  }

  async findByUserId(
    userId: string,
    query: PaginationQuery,
  ): Promise<PaginatedResponse<OrderEntity>> {
    const { page, limit } = query;
    const offset = (page - 1) * limit;
    const where = eq(orders.userId, userId);
    const [rows, countRow] = await Promise.all([
      this.db
        .select()
        .from(orders)
        .where(where)
        .orderBy(desc(orders.createdAt))
        .limit(limit)
        .offset(offset),
      this.db.select({ count: count() }).from(orders).where(where),
    ]);
    const total = countRow[0]?.count ?? 0;
    const data = await Promise.all(rows.map((row) => this.loadOrder(row)));
    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
    };
  }

  async list(query: PaginationQuery): Promise<PaginatedResponse<OrderEntity>> {
    const { page, limit } = query;
    const offset = (page - 1) * limit;
    const [rows, countRow] = await Promise.all([
      this.db
        .select()
        .from(orders)
        .orderBy(desc(orders.createdAt))
        .limit(limit)
        .offset(offset),
      this.db.select({ count: count() }).from(orders),
    ]);
    const total = countRow[0]?.count ?? 0;
    const data = await Promise.all(rows.map((row) => this.loadOrder(row)));
    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
    };
  }

  async create(data: CreateOrderData): Promise<OrderEntity> {
    const [orderRow] = await this.db
      .insert(orders)
      .values({
        userId: data.userId,
        guestEmail: data.guestEmail,
        paymentMethod: data.paymentMethod,
        shippingAddress: data.shippingAddress,
        notes: data.notes,
        subtotal: data.subtotal,
        total: data.total,
      })
      .returning();

    if (data.items.length) {
      await this.db.insert(orderItems).values(
        data.items.map((item) => ({
          orderId: orderRow.id,
          variantId: item.variantId,
          productName: item.productName,
          variantName: item.variantName,
          price: item.price,
          quantity: item.quantity,
        })),
      );
    }

    return this.loadOrder(orderRow);
  }

  async updateStatus(id: string, status: OrderStatus): Promise<OrderEntity | null> {
    const [row] = await this.db
      .update(orders)
      .set({ status, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();
    return row ? this.loadOrder(row) : null;
  }
}

export { ORDER_REPOSITORY };
