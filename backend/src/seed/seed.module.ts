import { Module } from '@nestjs/common';
import { CountriesModule } from '../countries/countries.module';
import { ThemesModule } from '../themes/themes.module';
import { SeedService } from './seed.service';
import { SeedController } from './seed.controller';

@Module({
  imports: [CountriesModule, ThemesModule],
  controllers: [SeedController],
  providers: [SeedService],
  exports: [SeedService],
})
export class SeedModule {}
