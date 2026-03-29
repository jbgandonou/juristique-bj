import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import databaseConfig from './config/database.config';
import { CountriesModule } from './countries/countries.module';
import { ThemesModule } from './themes/themes.module';
import { LegalTextsModule } from './legal-texts/legal-texts.module';
import { PipelineModule } from './pipeline/pipeline.module';
import { SeedModule } from './seed/seed.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { SearchModule } from './search/search.module';
import { CommentsModule } from './comments/comments.module';
import { AlertsModule } from './alerts/alerts.module';
import { BookmarksModule } from './bookmarks/bookmarks.module';
import { MailModule } from './mail/mail.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [databaseConfig] }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => config.get('database')!,
    }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    MailModule,
    CountriesModule,
    ThemesModule,
    LegalTextsModule,
    PipelineModule,
    SeedModule,
    UsersModule,
    AuthModule,
    SearchModule,
    CommentsModule,
    AlertsModule,
    BookmarksModule,
  ],
})
export class AppModule {}
