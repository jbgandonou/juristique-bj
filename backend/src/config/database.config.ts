import { registerAs } from '@nestjs/config';

export default registerAs('database', () => {
  const databaseUrl = process.env.DATABASE_URL;

  const isProduction = process.env.NODE_ENV === 'production';
  const synchronize = isProduction ? false : process.env.DB_SYNCHRONIZE !== 'false';

  if (isProduction && process.env.DB_SYNCHRONIZE === 'true') {
    console.warn(
      '⚠️  DB_SYNCHRONIZE=true is ignored in production. Use migrations instead.',
    );
  }

  if (databaseUrl) {
    return {
      type: 'postgres' as const,
      url: databaseUrl,
      autoLoadEntities: true,
      synchronize,
      ssl: { rejectUnauthorized: false },
      logging: !isProduction,
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
    synchronize,
  };
});
