import { Inject, Injectable } from '@nestjs/common';
import {
  and,
  asc,
  count,
  desc,
  eq,
  ilike,
  inArray,
  min,
  sql,
} from 'drizzle-orm';
import type {
  CreateProductImageInput,
  CreateProductInput,
  CreateProductVariantInput,
  PaginatedResponse,
  ProductListQuery,
  UpdateProductInput,
  UpdateProductVariantInput,
} from '@storix/shared';
import { DATABASE_CONNECTION, type Database } from '@/infrastructure/database/database.provider';
import {
  collectionProducts,
  productImages,
  products,
  productVariants,
} from '@/infrastructure/database/schema';
import { slugify } from '@/shared/utils/slugify';
import {
  ProductEntity,
  ProductImageEntity,
  ProductVariantEntity,
} from '../domain/entities/product.entity';
import type { IProductRepository } from '../domain/repositories/product.repository.interface';
import { PRODUCT_REPOSITORY } from '../domain/repositories/product.repository.interface';

@Injectable()
export class ProductRepository implements IProductRepository {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

  private async loadRelations(productIds: string[]): Promise<
    Map<
      string,
      { images: ProductImageEntity[]; variants: ProductVariantEntity[] }
    >
  > {
    if (!productIds.length) return new Map();

    const [images, variants] = await Promise.all([
      this.db
        .select()
        .from(productImages)
        .where(inArray(productImages.productId, productIds))
        .orderBy(asc(productImages.sortOrder)),
      this.db.select().from(productVariants).where(inArray(productVariants.productId, productIds)),
    ]);

    const map = new Map<
      string,
      { images: ProductImageEntity[]; variants: ProductVariantEntity[] }
    >();
    for (const id of productIds) {
      map.set(id, { images: [], variants: [] });
    }

    for (const img of images) {
      map.get(img.productId)?.images.push(
        new ProductImageEntity(
          img.id,
          img.productId,
          img.url,
          img.storageKey ?? '',
          img.alt,
          img.sortOrder,
        ),
      );
    }
    for (const v of variants) {
      map.get(v.productId)?.variants.push(
        new ProductVariantEntity(
          v.id,
          v.productId,
          v.sku,
          v.price,
          v.compareAtPrice,
          v.inventory,
          v.options ?? {},
          v.imageUrl,
          v.createdAt,
          v.updatedAt,
        ),
      );
    }
    return map;
  }

  private toEntity(
    row: typeof products.$inferSelect,
    relations?: { images: ProductImageEntity[]; variants: ProductVariantEntity[] },
  ): ProductEntity {
    return new ProductEntity(
      row.id,
      row.name,
      row.slug,
      row.description,
      row.status,
      row.metaTitle,
      row.metaDescription,
      row.createdAt,
      row.updatedAt,
      relations?.images ?? [],
      relations?.variants ?? [],
    );
  }

  async findById(id: string): Promise<ProductEntity | null> {
    const [row] = await this.db.select().from(products).where(eq(products.id, id)).limit(1);
    if (!row) return null;
    const relations = await this.loadRelations([row.id]);
    return this.toEntity(row, relations.get(row.id));
  }

  async findBySlug(slug: string, activeOnly = false): Promise<ProductEntity | null> {
    const conditions = activeOnly
      ? and(eq(products.slug, slug), eq(products.status, 'active'))
      : eq(products.slug, slug);
    const [row] = await this.db.select().from(products).where(conditions).limit(1);
    if (!row) return null;
    const relations = await this.loadRelations([row.id]);
    return this.toEntity(row, relations.get(row.id));
  }

  async list(query: ProductListQuery): Promise<PaginatedResponse<ProductEntity>> {
    const { page, limit, sort, direction, status, collectionId, search } = query;
    const offset = (page - 1) * limit;
    const conditions = [];

    if (status) conditions.push(eq(products.status, status));
    if (search) conditions.push(ilike(products.name, `%${search}%`));

    let productIdsFilter: string[] | undefined;
    if (collectionId) {
      const cpRows = await this.db
        .select({ productId: collectionProducts.productId })
        .from(collectionProducts)
        .where(eq(collectionProducts.collectionId, collectionId));
      productIdsFilter = cpRows.map((r) => r.productId);
      if (!productIdsFilter.length) {
        return { data: [], meta: { page, limit, total: 0, totalPages: 0 } };
      }
      conditions.push(inArray(products.id, productIdsFilter));
    }

    const where = conditions.length ? and(...conditions) : undefined;

    const orderBy =
      sort === 'name'
        ? direction === 'desc'
          ? desc(products.name)
          : asc(products.name)
        : sort === 'price'
          ? direction === 'desc'
            ? desc(min(productVariants.price))
            : asc(min(productVariants.price))
          : direction === 'desc'
            ? desc(products.createdAt)
            : asc(products.createdAt);

    let rows: (typeof products.$inferSelect)[];
    let total: number;

    if (sort === 'price') {
      const grouped = await this.db
        .select({
          product: products,
          minPrice: min(productVariants.price),
        })
        .from(products)
        .leftJoin(productVariants, eq(productVariants.productId, products.id))
        .where(where)
        .groupBy(products.id)
        .orderBy(orderBy)
        .limit(limit)
        .offset(offset);
      rows = grouped.map((g) => g.product);
      const [countRow] = await this.db.select({ count: count() }).from(products).where(where);
      total = countRow?.count ?? 0;
    } else {
      [rows, total] = await Promise.all([
        this.db.select().from(products).where(where).orderBy(orderBy).limit(limit).offset(offset),
        this.db
          .select({ count: count() })
          .from(products)
          .where(where)
          .then((r) => r[0]?.count ?? 0),
      ]);
    }

    const relations = await this.loadRelations(rows.map((r) => r.id));
    return {
      data: rows.map((row) => this.toEntity(row, relations.get(row.id))),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async create(data: CreateProductInput): Promise<ProductEntity> {
    const slug = data.slug ?? slugify(data.name);
    const [row] = await this.db
      .insert(products)
      .values({
        name: data.name,
        slug,
        description: data.description,
        status: data.status ?? 'draft',
        metaTitle: data.metaTitle,
        metaDescription: data.metaDescription,
      })
      .returning();
    return this.toEntity(row);
  }

  async update(id: string, data: UpdateProductInput): Promise<ProductEntity | null> {
    const [row] = await this.db
      .update(products)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();
    if (!row) return null;
    const relations = await this.loadRelations([row.id]);
    return this.toEntity(row, relations.get(row.id));
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db.delete(products).where(eq(products.id, id)).returning();
    return result.length > 0;
  }

  async addVariant(
    productId: string,
    data: CreateProductVariantInput,
  ): Promise<ProductEntity | null> {
    await this.db.insert(productVariants).values({
      productId,
      sku: data.sku,
      price: data.price,
      compareAtPrice: data.compareAtPrice,
      inventory: data.inventory ?? 0,
      options: data.options ?? {},
      imageUrl: data.imageUrl,
    });
    return this.findById(productId);
  }

  async updateVariant(
    productId: string,
    variantId: string,
    data: UpdateProductVariantInput,
  ): Promise<ProductEntity | null> {
    await this.db
      .update(productVariants)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(productVariants.id, variantId), eq(productVariants.productId, productId)));
    return this.findById(productId);
  }

  async deleteVariant(productId: string, variantId: string): Promise<ProductEntity | null> {
    await this.db
      .delete(productVariants)
      .where(and(eq(productVariants.id, variantId), eq(productVariants.productId, productId)));
    return this.findById(productId);
  }

  async addImage(
    productId: string,
    data: CreateProductImageInput,
  ): Promise<ProductEntity | null> {
    await this.db.insert(productImages).values({
      productId,
      url: data.url,
      storageKey: data.storageKey,
      alt: data.alt,
      sortOrder: data.sortOrder ?? 0,
    });
    return this.findById(productId);
  }

  async addImages(
    productId: string,
    data: CreateProductImageInput[],
  ): Promise<ProductEntity | null> {
    if (data.length) {
      await this.db.insert(productImages).values(
        data.map((img, index) => ({
          productId,
          url: img.url,
          storageKey: img.storageKey,
          alt: img.alt,
          sortOrder: img.sortOrder ?? index,
        })),
      );
    }
    return this.findById(productId);
  }

  async reorderImages(productId: string, imageIds: string[]): Promise<ProductEntity | null> {
    await Promise.all(
      imageIds.map((imageId, index) =>
        this.db
          .update(productImages)
          .set({ sortOrder: index })
          .where(and(eq(productImages.id, imageId), eq(productImages.productId, productId))),
      ),
    );
    return this.findById(productId);
  }

  async getImageById(
    productId: string,
    imageId: string,
  ): Promise<{ storageKey: string } | null> {
    const [row] = await this.db
      .select({ storageKey: productImages.storageKey })
      .from(productImages)
      .where(and(eq(productImages.id, imageId), eq(productImages.productId, productId)))
      .limit(1);
    return row ?? null;
  }

  async deleteImage(productId: string, imageId: string): Promise<ProductEntity | null> {
    await this.db
      .delete(productImages)
      .where(and(eq(productImages.id, imageId), eq(productImages.productId, productId)));
    return this.findById(productId);
  }

  async slugExists(slug: string, excludeId?: string): Promise<boolean> {
    const conditions = excludeId
      ? and(eq(products.slug, slug), sql`${products.id} != ${excludeId}`)
      : eq(products.slug, slug);
    const [row] = await this.db.select({ id: products.id }).from(products).where(conditions).limit(1);
    return !!row;
  }
}

export { PRODUCT_REPOSITORY };
