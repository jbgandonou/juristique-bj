import { Controller, Get, Post, Body, Param, Query, Res } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import type { Response } from 'express';
import { LegalTextsService } from './legal-texts.service';
import { CreateLegalTextDto } from './dto/create-legal-text.dto';
import { QueryLegalTextDto } from './dto/query-legal-text.dto';
import { ExportService } from './export.service';

@ApiTags('legal-texts')
@Controller('legal-texts')
export class LegalTextsController {
  constructor(
    private readonly service: LegalTextsService,
    private readonly exportService: ExportService,
  ) {}

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

  @Get(':id/export/pdf')
  @ApiOperation({ summary: 'Export legal text as PDF' })
  async exportPdf(@Param('id') id: string, @Res() res: Response) {
    const buffer = await this.exportService.exportPdf(id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="juristique-${id}.pdf"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  @Get(':id/export/word')
  @ApiOperation({ summary: 'Export legal text as Word document' })
  async exportWord(@Param('id') id: string, @Res() res: Response) {
    const buffer = await this.exportService.exportWord(id);
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename="juristique-${id}.docx"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  @Get(':id/citation')
  @ApiOperation({ summary: 'Get formatted citation for a legal text' })
  async getCitation(@Param('id') id: string) {
    const text = await this.service.findOne(id);
    return { citation: this.exportService.formatCitation(text) };
  }
}
