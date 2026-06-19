import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

export const DATABASE_CONNECTION = 'DATABASE_CONNECTION';

export type Database = ReturnType<typeof drizzle<typeof schema>>;

export const databaseProvider = {
  provide: DATABASE_CONNECTION,
  useFactory: (): Database => {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error('DATABASE_URL environment variable is required');
    }
    const client = postgres(url, { max: 10 });
    return drizzle(client, { schema });
  },
};
