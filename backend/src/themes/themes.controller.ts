import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ThemesService } from './themes.service';
import { CreateThemeDto } from './dto/create-theme.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

@ApiTags('themes')
@Controller('themes')
export class ThemesController {
  constructor(private readonly service: ThemesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a theme' })
  create(@Body() dto: CreateThemeDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all themes (flat)' })
  findAll(@Query() pagination: PaginationDto) {
    return this.service.findAll(pagination);
  }

  @Get('tree')
  @ApiOperation({ summary: 'Get themes as hierarchical tree' })
  getTree() {
    return this.service.getTree();
  }

  @Get('by-slug/:slug')
  @ApiOperation({ summary: 'Get theme by slug' })
  findBySlug(@Param('slug') slug: string) {
    return this.service.findBySlug(slug);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get theme by ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }
}
