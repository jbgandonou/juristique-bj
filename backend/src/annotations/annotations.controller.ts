import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AnnotationsService } from './annotations.service';
import { CreateAnnotationDto } from './dto/create-annotation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('annotations')
@Controller('annotations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AnnotationsController {
  constructor(private readonly service: AnnotationsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a private annotation' })
  create(@Request() req: any, @Body() dto: CreateAnnotationDto) {
    return this.service.create(req.user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all my annotations' })
  findAll(@Request() req: any) {
    return this.service.findAll(req.user.id);
  }

  @Get('by-text/:textId')
  @ApiOperation({ summary: 'Get my annotations for a specific text' })
  findByText(@Param('textId') textId: string, @Request() req: any) {
    return this.service.findByText(textId, req.user.id);
  }

  @Get('by-folder/:folderId')
  @ApiOperation({ summary: 'Get my annotations in a folder' })
  findByFolder(@Param('folderId') folderId: string, @Request() req: any) {
    return this.service.findByFolder(folderId, req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update annotation content' })
  update(@Param('id') id: string, @Request() req: any, @Body('content') content: string) {
    return this.service.update(id, req.user.id, content);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete annotation' })
  delete(@Param('id') id: string, @Request() req: any) {
    return this.service.delete(id, req.user.id);
  }
}
