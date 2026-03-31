import { registerAs } from '@nestjs/config';

export default registerAs('database', () => {
  const databaseUrl = process.env.DATABASE_URL;

  if (databaseUrl) {
    return {
      type: 'postgres' as const,
      url: databaseUrl,
      autoLoadEntities: true,
      synchronize: process.env.DB_SYNCHRONIZE === 'true',
      ssl: { rejectUnauthorized: false },
      logging: process.env.NODE_ENV !== 'production',
    };
  }

  return {
    type: 'postgres' as const,
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT ?? '5432', 10) || 5432,
    username: process.env.POSTGRES_USER || 'juristique',
    password: process.env.POSTGRES_PASSWORD || 'juristique_dev',
    database: process.env.POSTGRES_DB || 'juristique',
    autoLoadEntities: true,
    synchronize: process.env.NODE_ENV !== 'production',
  };
});
