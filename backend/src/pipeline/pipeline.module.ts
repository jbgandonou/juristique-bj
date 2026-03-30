import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PipelineJob } from './entities/pipeline-job.entity';
import { SourceConfig } from './entities/source-config.entity';
import { LegalText } from '../legal-texts/entities/legal-text.entity';
import { Country } from '../countries/entities/country.entity';
import { PipelineService } from './pipeline.service';
import { PipelineController } from './pipeline.controller';
import { PipelineProcessor } from './pipeline.processor';
import { ConstituteScraper } from './scrapers/constitute.scraper';
import { FaolexScraper } from './scrapers/faolex.scraper';
import { OhadaScraper } from './scrapers/ohada.scraper';

@Module({
  imports: [
    TypeOrmModule.forFeature([PipelineJob, SourceConfig, LegalText, Country]),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const redisUrl = config.get<string>('REDIS_URL');
        if (redisUrl) {
          const parsed = new URL(redisUrl);
          return {
            connection: {
              host: parsed.hostname,
              port: parseInt(parsed.port, 10) || 6379,
              password: parsed.password || undefined,
              tls: parsed.protocol === 'rediss:' ? {} : undefined,
              maxRetriesPerRequest: null,
            },
          };
        }
        return {
          connection: {
            host: config.get<string>('REDIS_HOST', 'localhost'),
            port: config.get<number>('REDIS_PORT', 6379),
            maxRetriesPerRequest: null,
          },
        };
      },
    }),
    BullModule.registerQueue({ name: 'pipeline' }),
  ],
  controllers: [PipelineController],
  providers: [
    PipelineService,
    PipelineProcessor,
    ConstituteScraper,
    FaolexScraper,
    OhadaScraper,
  ],
  exports: [PipelineService],
})
export class PipelineModule {}
