import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { LegalTextsService } from './legal-texts.service';
import { CreateLegalTextDto } from './dto/create-legal-text.dto';
import { QueryLegalTextDto } from './dto/query-legal-text.dto';

@ApiTags('legal-texts')
@Controller('legal-texts')
export class LegalTextsController {
  constructor(private readonly service: LegalTextsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a legal text' })
  create(@Body() dto: CreateLegalTextDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List legal texts with filters' })
  findAll(@Query() query: QueryLegalTextDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a legal text by ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }
}
