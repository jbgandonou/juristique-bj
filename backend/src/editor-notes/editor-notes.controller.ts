import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { EditorNotesService } from './editor-notes.service';
import { CreateEditorNoteDto } from './dto/create-editor-note.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('editor-notes')
@Controller('editor-notes')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class EditorNotesController {
  constructor(private readonly service: EditorNotesService) {}

  @Post()
  @ApiOperation({ summary: 'Create an editor note' })
  create(@Request() req: any, @Body() dto: CreateEditorNoteDto) {
    return this.service.create(req.user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all my editor notes' })
  findAll(@Request() req: any) {
    return this.service.findAll(req.user.id);
  }

  @Get('by-folder/:folderId')
  @ApiOperation({ summary: 'Get notes in a folder' })
  findByFolder(@Param('folderId') folderId: string, @Request() req: any) {
    return this.service.findByFolder(folderId, req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a note' })
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.service.findOne(id, req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a note (auto-save)' })
  update(@Param('id') id: string, @Request() req: any, @Body() dto: Partial<CreateEditorNoteDto> & { isPinned?: boolean }) {
    return this.service.update(id, req.user.id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a note' })
  delete(@Param('id') id: string, @Request() req: any) {
    return this.service.delete(id, req.user.id);
  }
}
