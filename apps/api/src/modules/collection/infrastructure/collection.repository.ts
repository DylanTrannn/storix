import { Inject, Injectable } from '@nestjs/common';
import { and, asc, count, eq, sql } from 'drizzle-orm';
import type {
  CreateCollectionInput,
  PaginatedResponse,
  PaginationQuery,
  UpdateCollectionInput,
} from '@storix/shared';
import { DATABASE_CONNECTION, type Database } from '@/infrastructure/database/database.provider';
import { collectionProducts, collections } from '@/infrastructure/database/schema';
import { slugify } from '@/shared/utils/slugify';
import { CollectionEntity } from '../domain/entities/collection.entity';
import type { ICollectionRepository } from '../domain/repositories/collection.repository.interface';
import { COLLECTION_REPOSITORY } from '../domain/repositories/collection.repository.interface';

@Injectable()
export class CollectionRepository implements ICollectionRepository {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

  private async getProductCount(collectionId: string): Promise<number> {
    const [row] = await this.db
      .select({ count: count() })
      .from(collectionProducts)
      .where(eq(collectionProducts.collectionId, collectionId));
    return row?.count ?? 0;
  }

  private toEntity(
    row: typeof collections.$inferSelect,
    productCount?: number,
  ): CollectionEntity {
    return new CollectionEntity(
      row.id,
      row.name,
      row.slug,
      row.description,
      row.imageUrl,
      row.createdAt,
      row.updatedAt,
      productCount,
    );
  }

  async findById(id: string): Promise<CollectionEntity | null> {
    const [row] = await this.db.select().from(collections).where(eq(collections.id, id)).limit(1);
    if (!row) return null;
    const productCount = await this.getProductCount(row.id);
    return this.toEntity(row, productCount);
  }

  async findBySlug(slug: string): Promise<CollectionEntity | null> {
    const [row] = await this.db
      .select()
      .from(collections)
      .where(eq(collections.slug, slug))
      .limit(1);
    if (!row) return null;
    const productCount = await this.getProductCount(row.id);
    return this.toEntity(row, productCount);
  }

  async list(query: PaginationQuery): Promise<PaginatedResponse<CollectionEntity>> {
    const { page, limit } = query;
    const offset = (page - 1) * limit;
    const [rows, countRow] = await Promise.all([
      this.db.select().from(collections).orderBy(asc(collections.name)).limit(limit).offset(offset),
      this.db.select({ count: count() }).from(collections),
    ]);
    const total = countRow[0]?.count ?? 0;
    const data = await Promise.all(
      rows.map(async (row) => {
        const productCount = await this.getProductCount(row.id);
        return this.toEntity(row, productCount);
      }),
    );
    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
    };
  }

  async create(data: CreateCollectionInput): Promise<CollectionEntity> {
    const slug = data.slug ?? slugify(data.name);
    const [row] = await this.db
      .insert(collections)
      .values({
        name: data.name,
        slug,
        description: data.description,
        imageUrl: data.imageUrl,
      })
      .returning();
    return this.toEntity(row, 0);
  }

  async update(id: string, data: UpdateCollectionInput): Promise<CollectionEntity | null> {
    const [row] = await this.db
      .update(collections)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(collections.id, id))
      .returning();
    if (!row) return null;
    const productCount = await this.getProductCount(row.id);
    return this.toEntity(row, productCount);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db.delete(collections).where(eq(collections.id, id)).returning();
    return result.length > 0;
  }

  async assignProducts(
    collectionId: string,
    productIds: string[],
  ): Promise<CollectionEntity | null> {
    await this.db
      .delete(collectionProducts)
      .where(eq(collectionProducts.collectionId, collectionId));
    if (productIds.length) {
      await this.db.insert(collectionProducts).values(
        productIds.map((productId) => ({ collectionId, productId })),
      );
    }
    return this.findById(collectionId);
  }

  async slugExists(slug: string, excludeId?: string): Promise<boolean> {
    const conditions = excludeId
      ? and(eq(collections.slug, slug), sql`${collections.id} != ${excludeId}`)
      : eq(collections.slug, slug);
    const [row] = await this.db
      .select({ id: collections.id })
      .from(collections)
      .where(conditions)
      .limit(1);
    return !!row;
  }
}

export { COLLECTION_REPOSITORY };
