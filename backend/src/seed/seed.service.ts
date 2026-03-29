import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { readFileSync } from 'fs';
import { join } from 'path';
import { CountriesService } from '../countries/countries.service';
import { ThemesService } from '../themes/themes.service';

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    private readonly countriesService: CountriesService,
    private readonly themesService: ThemesService,
  ) {}

  async seed(): Promise<void> {
    await this.seedCountries();
    await this.seedThemes();
  }

  private async seedCountries(): Promise<void> {
    const filePath = join(__dirname, 'data', 'countries.json');
    const countries: Array<{
      name: string;
      code: string;
      region: string;
      legalSystem: string;
      officialLang: string;
    }> = JSON.parse(readFileSync(filePath, 'utf-8'));

    let created = 0;
    let skipped = 0;

    for (const country of countries) {
      try {
        await this.countriesService.findByCode(country.code);
        skipped++;
      } catch (err) {
        if (err instanceof NotFoundException) {
          await this.countriesService.create(country);
          created++;
        } else {
          throw err;
        }
      }
    }

    this.logger.log(
      `Countries seeded: ${created} created, ${skipped} skipped (already exist)`,
    );
  }

  private async seedThemes(): Promise<void> {
    const filePath = join(__dirname, 'data', 'themes.json');
    const themes: Array<{
      name: string;
      slug: string;
      icon: string;
    }> = JSON.parse(readFileSync(filePath, 'utf-8'));

    let created = 0;
    let skipped = 0;

    for (const theme of themes) {
      try {
        await this.themesService.findBySlug(theme.slug);
        skipped++;
      } catch (err) {
        if (err instanceof NotFoundException) {
          await this.themesService.create(theme);
          created++;
        } else {
          throw err;
        }
      }
    }

    this.logger.log(
      `Themes seeded: ${created} created, ${skipped} skipped (already exist)`,
    );
  }
}
