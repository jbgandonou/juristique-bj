import { Module } from '@nestjs/common';
import { CountriesModule } from '../countries/countries.module';
import { ThemesModule } from '../themes/themes.module';
import { SeedService } from './seed.service';

@Module({
  imports: [CountriesModule, ThemesModule],
  providers: [SeedService],
  exports: [SeedService],
})
export class SeedModule {}
