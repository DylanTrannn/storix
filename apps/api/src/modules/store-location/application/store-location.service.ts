import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type {
  CreateStoreLocationInput,
  UpdateStoreLocationInput,
} from '@storix/shared';
import type { IStoreLocationRepository } from '../domain/repositories/store-location.repository.interface';
import { STORE_LOCATION_REPOSITORY } from '../domain/repositories/store-location.repository.interface';

@Injectable()
export class StoreLocationService {
  constructor(
    @Inject(STORE_LOCATION_REPOSITORY)
    private readonly storeLocationRepository: IStoreLocationRepository,
  ) {}

  async list() {
    const locations = await this.storeLocationRepository.findAll();
    return locations.map((loc) => loc.toPublic());
  }

  async getById(id: string) {
    const location = await this.storeLocationRepository.findById(id);
    if (!location) {
      throw new NotFoundException('Store location not found');
    }
    return location.toPublic();
  }

  async create(input: CreateStoreLocationInput) {
    const location = await this.storeLocationRepository.create(input);
    return location.toPublic();
  }

  async update(id: string, input: UpdateStoreLocationInput) {
    const location = await this.storeLocationRepository.update(id, input);
    if (!location) {
      throw new NotFoundException('Store location not found');
    }
    return location.toPublic();
  }

  async delete(id: string) {
    const deleted = await this.storeLocationRepository.delete(id);
    if (!deleted) {
      throw new NotFoundException('Store location not found');
    }
  }
}
