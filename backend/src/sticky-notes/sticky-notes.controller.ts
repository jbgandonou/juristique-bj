import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { StickyNotesService } from './sticky-notes.service';
import { CreateStickyNoteDto } from './dto/create-sticky-note.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('sticky-notes')
@Controller('sticky-notes')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class StickyNotesController {
  constructor(private readonly service: StickyNotesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a sticky note' })
  create(@Request() req: any, @Body() dto: CreateStickyNoteDto) {
    return this.service.create(req.user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all my sticky notes' })
  findAll(@Request() req: any) {
    return this.service.findAll(req.user.id);
  }

  @Get('by-text/:textId')
  @ApiOperation({ summary: 'Get sticky notes for a specific text' })
  findByText(@Param('textId') textId: string, @Request() req: any) {
    return this.service.findByText(textId, req.user.id);
  }

  @Get('by-folder/:folderId')
  @ApiOperation({ summary: 'Get sticky notes in a folder' })
  findByFolder(@Param('folderId') folderId: string, @Request() req: any) {
    return this.service.findByFolder(folderId, req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a sticky note' })
  update(
    @Param('id') id: string,
    @Request() req: any,
    @Body() body: { content?: string; color?: string; isPinned?: boolean; positionX?: number; positionY?: number },
  ) {
    return this.service.update(id, req.user.id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a sticky note' })
  delete(@Param('id') id: string, @Request() req: any) {
    return this.service.delete(id, req.user.id);
  }
}
