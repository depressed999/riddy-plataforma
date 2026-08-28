import { Inject, Injectable, type OnApplicationShutdown } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres, { type Sql } from 'postgres';

import * as schema from './schema';

@Injectable()
export class DatabaseService implements OnApplicationShutdown {
  readonly database: PostgresJsDatabase<typeof schema>;
  private readonly client: Sql;

  constructor(@Inject(ConfigService) configService: ConfigService) {
    const databaseUrl = configService.getOrThrow<string>('DATABASE_URL');
    const maxConnections = configService.get<number>('DATABASE_POOL_SIZE', 10);

    this.client = postgres(databaseUrl, {
      idle_timeout: 20,
      max: maxConnections,
    });
    this.database = drizzle(this.client, { schema });
  }

  async onApplicationShutdown(): Promise<void> {
    await this.client.end({ timeout: 5 });
  }

  async ping(): Promise<boolean> {
    const [result] = await this.client<{ ok: number }[]>`select 1 as ok`;
    return result?.ok === 1;
  }
}
