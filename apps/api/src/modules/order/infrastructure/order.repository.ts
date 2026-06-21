import { Inject, Injectable } from '@nestjs/common';
import { asc, count, desc, eq, inArray } from 'drizzle-orm';
import type {
  OrderStatus,
  PaginatedResponse,
  PaginationQuery,
} from '@storix/shared';
import { DATABASE_CONNECTION, type Database } from '@/infrastructure/database/database.provider';
import {
  orderItems,
  orders,
  productImages,
  productVariants,
  products,
} from '@/infrastructure/database/schema';
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
    const rows = await this.db
      .select({
        item: orderItems,
        variant: productVariants,
        productId: products.id,
        productSlug: products.slug,
      })
      .from(orderItems)
      .innerJoin(productVariants, eq(orderItems.variantId, productVariants.id))
      .innerJoin(products, eq(productVariants.productId, products.id))
      .where(eq(orderItems.orderId, orderRow.id));

    const productIds = [...new Set(rows.map(({ productId }) => productId))];
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

    const itemEntities = rows.map(({ item, variant, productId, productSlug }) => {
      const imageUrl = variant.imageUrl ?? primaryImageByProduct.get(productId) ?? null;
      return new OrderItemEntity(
        item.id,
        item.orderId,
        item.variantId,
        item.productName,
        item.variantName,
        item.price,
        item.quantity,
        productSlug,
        imageUrl,
      );
    });

    return new OrderEntity(
      orderRow.id,
      orderRow.orderNumber,
      orderRow.userId,
      orderRow.guestEmail,
      orderRow.status,
      orderRow.paymentStatus,
      orderRow.paymentMethod,
      orderRow.transferReference,
      orderRow.customerMarkedPaidAt,
      orderRow.paymentConfirmedAt,
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
        paymentStatus: data.paymentStatus,
        transferReference: data.transferReference,
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

  async markPaymentSubmitted(id: string): Promise<OrderEntity | null> {
    const [row] = await this.db
      .update(orders)
      .set({
        paymentStatus: 'awaiting_review',
        customerMarkedPaidAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(orders.id, id))
      .returning();
    return row ? this.loadOrder(row) : null;
  }

  async confirmPayment(id: string, confirmed: boolean): Promise<OrderEntity | null> {
    const now = new Date();
    const [row] = await this.db
      .update(orders)
      .set(
        confirmed
          ? {
              paymentStatus: 'confirmed',
              paymentConfirmedAt: now,
              status: 'confirmed',
              updatedAt: now,
            }
          : {
              paymentStatus: 'rejected',
              status: 'cancelled',
              updatedAt: now,
            },
      )
      .where(eq(orders.id, id))
      .returning();
    return row ? this.loadOrder(row) : null;
  }

  async updateTransferReference(
    id: string,
    transferReference: string,
  ): Promise<OrderEntity | null> {
    const [row] = await this.db
      .update(orders)
      .set({ transferReference, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();
    return row ? this.loadOrder(row) : null;
  }
}

export { ORDER_REPOSITORY };
