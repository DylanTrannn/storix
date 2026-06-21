import { Inject, Injectable } from '@nestjs/common';
import type Redis from 'ioredis';
import { sql } from 'drizzle-orm';
import {
  DATABASE_CONNECTION,
  type Database,
} from '@/infrastructure/database/database.provider';
import { REDIS_CLIENT } from '@/infrastructure/redis/redis.provider';

export type HealthCheckStatus = 'ok' | 'error';

export interface HealthCheckResult {
  status: HealthCheckStatus;
  timestamp: string;
  checks?: {
    database: HealthCheckStatus;
    redis: HealthCheckStatus;
  };
}

@Injectable()
export class HealthService {
  constructor(
    @Inject(DATABASE_CONNECTION) private readonly db: Database,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  liveness(): HealthCheckResult {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  async readiness(): Promise<HealthCheckResult> {
    const [database, redis] = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
    ]);

    const checks = { database, redis };
    const status =
      database === 'ok' && redis === 'ok' ? 'ok' : 'error';

    return {
      status,
      timestamp: new Date().toISOString(),
      checks,
    };
  }

  private async checkDatabase(): Promise<HealthCheckStatus> {
    try {
      await this.db.execute(sql`SELECT 1`);
      return 'ok';
    } catch {
      return 'error';
    }
  }

  private async checkRedis(): Promise<HealthCheckStatus> {
    try {
      const pong = await this.redis.ping();
      return pong === 'PONG' ? 'ok' : 'error';
    } catch {
      return 'error';
    }
  }
}
