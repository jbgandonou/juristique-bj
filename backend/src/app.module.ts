import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import databaseConfig from './config/database.config';
import { CountriesModule } from './countries/countries.module';
import { ThemesModule } from './themes/themes.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [databaseConfig] }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => config.get('database')!,
    }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    CountriesModule,
    ThemesModule,
  ],
})
export class AppModule {}
