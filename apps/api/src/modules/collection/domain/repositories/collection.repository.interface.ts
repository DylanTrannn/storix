import type {
  CreateCollectionInput,
  CollectionListQuery,
  PaginatedResponse,
  UpdateCollectionInput,
} from '@storix/shared';
import type { CollectionEntity } from '../entities/collection.entity';

export const COLLECTION_REPOSITORY = Symbol('COLLECTION_REPOSITORY');

export interface ICollectionRepository {
  findById(id: string): Promise<CollectionEntity | null>;
  findBySlug(slug: string): Promise<CollectionEntity | null>;
  list(query: CollectionListQuery): Promise<PaginatedResponse<CollectionEntity>>;
  create(data: CreateCollectionInput): Promise<CollectionEntity>;
  update(id: string, data: UpdateCollectionInput): Promise<CollectionEntity | null>;
  delete(id: string): Promise<boolean>;
  assignProducts(collectionId: string, productIds: string[]): Promise<CollectionEntity | null>;
  slugExists(slug: string, excludeId?: string): Promise<boolean>;
}
