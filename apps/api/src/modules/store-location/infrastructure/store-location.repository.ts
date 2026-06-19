import { Inject, Injectable } from '@nestjs/common';
import { asc, eq } from 'drizzle-orm';
import type {
  CreateStoreLocationInput,
  UpdateStoreLocationInput,
} from '@storix/shared';
import { DATABASE_CONNECTION, type Database } from '@/infrastructure/database/database.provider';
import { storeLocations } from '@/infrastructure/database/schema';
import { StoreLocationEntity } from '../domain/entities/store-location.entity';
import type { IStoreLocationRepository } from '../domain/repositories/store-location.repository.interface';
import { STORE_LOCATION_REPOSITORY } from '../domain/repositories/store-location.repository.interface';

@Injectable()
export class StoreLocationRepository implements IStoreLocationRepository {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

  private toEntity(row: typeof storeLocations.$inferSelect): StoreLocationEntity {
    return new StoreLocationEntity(
      row.id,
      row.name,
      row.address,
      row.phone,
      row.mapUrl,
      row.hours,
      row.createdAt,
      row.updatedAt,
    );
  }

  async findAll(): Promise<StoreLocationEntity[]> {
    const rows = await this.db.select().from(storeLocations).orderBy(asc(storeLocations.name));
    return rows.map((row) => this.toEntity(row));
  }

  async findById(id: string): Promise<StoreLocationEntity | null> {
    const [row] = await this.db
      .select()
      .from(storeLocations)
      .where(eq(storeLocations.id, id))
      .limit(1);
    return row ? this.toEntity(row) : null;
  }

  async create(data: CreateStoreLocationInput): Promise<StoreLocationEntity> {
    const [row] = await this.db.insert(storeLocations).values(data).returning();
    return this.toEntity(row);
  }

  async update(id: string, data: UpdateStoreLocationInput): Promise<StoreLocationEntity | null> {
    const [row] = await this.db
      .update(storeLocations)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(storeLocations.id, id))
      .returning();
    return row ? this.toEntity(row) : null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db.delete(storeLocations).where(eq(storeLocations.id, id)).returning();
    return result.length > 0;
  }
}

export { STORE_LOCATION_REPOSITORY };
