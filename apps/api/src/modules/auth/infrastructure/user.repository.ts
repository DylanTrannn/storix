import { Inject, Injectable } from '@nestjs/common';
import { eq, sql } from 'drizzle-orm';
import { DATABASE_CONNECTION, type Database } from '@/infrastructure/database/database.provider';
import { users } from '@/infrastructure/database/schema';
import { UserEntity } from '../domain/entities/user.entity';
import type {
  CreateUserData,
  IUserRepository,
  UpdateUserData,
} from '../domain/repositories/user.repository.interface';
import { USER_REPOSITORY } from '../domain/repositories/user.repository.interface';

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

  private toEntity(row: typeof users.$inferSelect): UserEntity {
    return new UserEntity(
      row.id,
      row.email,
      row.passwordHash,
      row.firstName,
      row.lastName,
      row.role,
      row.createdAt,
      row.updatedAt,
    );
  }

  async findById(id: string): Promise<UserEntity | null> {
    const [row] = await this.db.select().from(users).where(eq(users.id, id)).limit(1);
    return row ? this.toEntity(row) : null;
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const [row] = await this.db.select().from(users).where(eq(users.email, email)).limit(1);
    return row ? this.toEntity(row) : null;
  }

  async create(data: CreateUserData): Promise<UserEntity> {
    const [row] = await this.db
      .insert(users)
      .values({
        email: data.email,
        passwordHash: data.passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role ?? 'customer',
      })
      .returning();
    return this.toEntity(row);
  }

  async update(id: string, data: UpdateUserData): Promise<UserEntity | null> {
    const [row] = await this.db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return row ? this.toEntity(row) : null;
  }

  async listCustomers(
    page: number,
    limit: number,
  ): Promise<{ users: UserEntity[]; total: number }> {
    const offset = (page - 1) * limit;
    const [rows, countResult] = await Promise.all([
      this.db
        .select()
        .from(users)
        .where(eq(users.role, 'customer'))
        .limit(limit)
        .offset(offset)
        .orderBy(users.createdAt),
      this.db
        .select({ count: sql<number>`count(*)::int` })
        .from(users)
        .where(eq(users.role, 'customer')),
    ]);
    return {
      users: rows.map((row) => this.toEntity(row)),
      total: countResult[0]?.count ?? 0,
    };
  }
}

export { USER_REPOSITORY };
