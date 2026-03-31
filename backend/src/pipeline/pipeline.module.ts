import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PipelineJob } from './entities/pipeline-job.entity';
import { SourceConfig } from './entities/source-config.entity';
import { PipelineAlert } from './entities/pipeline-alert.entity';
import { LegalText } from '../legal-texts/entities/legal-text.entity';
import { Country } from '../countries/entities/country.entity';
import { PipelineService } from './pipeline.service';
import { PipelineController } from './pipeline.controller';
import { PipelineProcessor } from './pipeline.processor';
import { PipelineAlertsService } from './pipeline-alerts.service';
import { PipelineAlertsController } from './pipeline-alerts.controller';
import { FaolexScraper } from './scrapers/faolex.scraper';
import { OhadaScraper } from './scrapers/ohada.scraper';
import { ConstitutionsScraper } from './scrapers/constitutions.scraper';
import { CcjaScraper } from './scrapers/ccja.scraper';
import { AssembleesScraper } from './scrapers/assemblees.scraper';
import { JournauxScraper } from './scrapers/journaux.scraper';

@Module({
  imports: [
    TypeOrmModule.forFeature([PipelineJob, SourceConfig, LegalText, Country, PipelineAlert]),
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
  controllers: [PipelineController, PipelineAlertsController],
  providers: [
    PipelineService,
    PipelineAlertsService,
    PipelineProcessor,
    FaolexScraper,
    OhadaScraper,
    ConstitutionsScraper,
    CcjaScraper,
    AssembleesScraper,
    JournauxScraper,
  ],
  exports: [PipelineService, PipelineAlertsService],
})
export class PipelineModule {}
