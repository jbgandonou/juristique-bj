import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LegalText } from './entities/legal-text.entity';
import { TextReference } from './entities/text-reference.entity';
import { TextVersion } from './entities/text-version.entity';
import { Theme } from '../themes/entities/theme.entity';
import { LegalTextsService } from './legal-texts.service';
import { LegalTextsController } from './legal-texts.controller';
import { SearchModule } from '../search/search.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([LegalText, TextReference, TextVersion, Theme]),
    SearchModule,
  ],
  controllers: [LegalTextsController],
  providers: [LegalTextsService],
  exports: [LegalTextsService],
})
export class LegalTextsModule {}
