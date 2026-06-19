import type {
  CreateStoreLocationInput,
  UpdateStoreLocationInput,
} from '@storix/shared';
import type { StoreLocationEntity } from '../entities/store-location.entity';

export const STORE_LOCATION_REPOSITORY = Symbol('STORE_LOCATION_REPOSITORY');

export interface IStoreLocationRepository {
  findAll(): Promise<StoreLocationEntity[]>;
  findById(id: string): Promise<StoreLocationEntity | null>;
  create(data: CreateStoreLocationInput): Promise<StoreLocationEntity>;
  update(id: string, data: UpdateStoreLocationInput): Promise<StoreLocationEntity | null>;
  delete(id: string): Promise<boolean>;
}
