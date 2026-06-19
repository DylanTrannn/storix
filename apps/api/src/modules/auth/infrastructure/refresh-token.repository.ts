import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DATABASE_CONNECTION, type Database } from '@/infrastructure/database/database.provider';
import { refreshTokens } from '@/infrastructure/database/schema';
import type {
  IRefreshTokenRepository,
  RefreshTokenRecord,
} from '../domain/repositories/refresh-token.repository.interface';
import { REFRESH_TOKEN_REPOSITORY } from '../domain/repositories/refresh-token.repository.interface';

@Injectable()
export class RefreshTokenRepository implements IRefreshTokenRepository {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

  private toRecord(row: typeof refreshTokens.$inferSelect): RefreshTokenRecord {
    return {
      id: row.id,
      userId: row.userId,
      token: row.token,
      expiresAt: row.expiresAt,
      createdAt: row.createdAt,
    };
  }

  async create(userId: string, token: string, expiresAt: Date): Promise<RefreshTokenRecord> {
    const [row] = await this.db
      .insert(refreshTokens)
      .values({ userId, token, expiresAt })
      .returning();
    return this.toRecord(row);
  }

  async findByToken(token: string): Promise<RefreshTokenRecord | null> {
    const [row] = await this.db
      .select()
      .from(refreshTokens)
      .where(eq(refreshTokens.token, token))
      .limit(1);
    return row ? this.toRecord(row) : null;
  }

  async deleteByToken(token: string): Promise<void> {
    await this.db.delete(refreshTokens).where(eq(refreshTokens.token, token));
  }

  async deleteByUserId(userId: string): Promise<void> {
    await this.db.delete(refreshTokens).where(eq(refreshTokens.userId, userId));
  }
}

export { REFRESH_TOKEN_REPOSITORY };
