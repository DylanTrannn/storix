import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type {
  CreateCollectionInput,
  PaginatedResponse,
  PaginationQuery,
  ProductListQuery,
  UpdateCollectionInput,
} from '@storix/shared';
import { slugify } from '@/shared/utils/slugify';
import { ProductService } from '../../product/application/product.service';
import type { CollectionEntity } from '../domain/entities/collection.entity';
import type { ICollectionRepository } from '../domain/repositories/collection.repository.interface';
import { COLLECTION_REPOSITORY } from '../domain/repositories/collection.repository.interface';

@Injectable()
export class CollectionService {
  constructor(
    @Inject(COLLECTION_REPOSITORY) private readonly collectionRepository: ICollectionRepository,
    private readonly productService: ProductService,
  ) {}

  async list(query: PaginationQuery): Promise<PaginatedResponse<ReturnType<CollectionEntity['toDetail']>>> {
    const result = await this.collectionRepository.list(query);
    return {
      data: result.data.map((c) => c.toDetail()),
      meta: result.meta,
    };
  }

  async getBySlug(slug: string) {
    const collection = await this.collectionRepository.findBySlug(slug);
    if (!collection) {
      throw new NotFoundException('Collection not found');
    }
    return collection.toDetail();
  }

  async getBySlugWithProducts(
    slug: string,
    query: Pick<ProductListQuery, 'page' | 'limit' | 'sort' | 'direction'>,
  ) {
    const collection = await this.collectionRepository.findBySlug(slug);
    if (!collection) {
      throw new NotFoundException('Collection not found');
    }
    const products = await this.productService.list({
      page: query.page ?? 1,
      limit: query.limit ?? 20,
      sort: query.sort,
      direction: query.direction,
      status: 'active',
      collectionId: collection.id,
    });
    return {
      ...collection.toDetail(),
      products,
    };
  }

  async getById(id: string) {
    const collection = await this.collectionRepository.findById(id);
    if (!collection) {
      throw new NotFoundException('Collection not found');
    }
    return collection.toDetail();
  }

  async create(input: CreateCollectionInput) {
    const slug = input.slug ?? slugify(input.name);
    if (await this.collectionRepository.slugExists(slug)) {
      throw new ConflictException('Collection slug already exists');
    }
    const collection = await this.collectionRepository.create({ ...input, slug });
    return collection.toDetail();
  }

  async update(id: string, input: UpdateCollectionInput) {
    if (input.slug && (await this.collectionRepository.slugExists(input.slug, id))) {
      throw new ConflictException('Collection slug already exists');
    }
    const collection = await this.collectionRepository.update(id, input);
    if (!collection) {
      throw new NotFoundException('Collection not found');
    }
    return collection.toDetail();
  }

  async delete(id: string) {
    const deleted = await this.collectionRepository.delete(id);
    if (!deleted) {
      throw new NotFoundException('Collection not found');
    }
  }

  async assignProducts(id: string, productIds: string[]) {
    const collection = await this.collectionRepository.assignProducts(id, productIds);
    if (!collection) {
      throw new NotFoundException('Collection not found');
    }
    return collection.toDetail();
  }
}
