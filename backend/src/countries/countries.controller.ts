import { Controller, Get, Post, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CountriesService } from './countries.service';
import { CreateCountryDto } from './dto/create-country.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

@ApiTags('countries')
@Controller('countries')
export class CountriesController {
  constructor(private readonly service: CountriesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a country' })
  create(@Body() dto: CreateCountryDto) {
    return this.service.create(dto);
  }

  @Delete('admin/purge-all')
  @ApiOperation({ summary: 'Delete all countries' })
  async purgeAll() {
    const count = await this.service.repo.count();
    await this.service.repo.query('TRUNCATE TABLE countries RESTART IDENTITY CASCADE');
    await this.service.repo.query('REINDEX TABLE countries');
    return { deleted: count };
  }

  @Get()
  @ApiOperation({ summary: 'List all countries' })
  findAll(@Query() pagination: PaginationDto) {
    return this.service.findAll(pagination);
  }

  @Get('by-code/:code')
  @ApiOperation({ summary: 'Get country by ISO code' })
  findByCode(@Param('code') code: string) {
    return this.service.findByCode(code);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get country by ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }
}
