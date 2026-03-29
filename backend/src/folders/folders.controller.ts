import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FoldersService } from './folders.service';
import { CreateFolderDto, AddTextToFolderDto, ShareFolderDto } from './dto/create-folder.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('folders')
@Controller('folders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FoldersController {
  constructor(private readonly service: FoldersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a folder' })
  create(@Request() req: any, @Body() dto: CreateFolderDto) {
    return this.service.create(req.user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List my folders (owned + shared with me)' })
  findAll(@Request() req: any) {
    return this.service.findMyFolders(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get folder details with texts' })
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.service.findOne(id, req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update folder' })
  update(@Param('id') id: string, @Request() req: any, @Body() dto: Partial<CreateFolderDto>) {
    return this.service.update(id, req.user.id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete folder' })
  delete(@Param('id') id: string, @Request() req: any) {
    return this.service.delete(id, req.user.id);
  }

  @Post(':id/texts')
  @ApiOperation({ summary: 'Add a text to folder' })
  addText(@Param('id') id: string, @Request() req: any, @Body() dto: AddTextToFolderDto) {
    return this.service.addText(id, dto.textId, req.user.id);
  }

  @Delete(':id/texts/:textId')
  @ApiOperation({ summary: 'Remove a text from folder' })
  removeText(@Param('id') id: string, @Param('textId') textId: string, @Request() req: any) {
    return this.service.removeText(id, textId, req.user.id);
  }

  @Post(':id/shares')
  @ApiOperation({ summary: 'Share folder with a user' })
  share(@Param('id') id: string, @Request() req: any, @Body() dto: ShareFolderDto) {
    return this.service.share(id, req.user.id, dto);
  }

  @Delete(':id/shares/:shareId')
  @ApiOperation({ summary: 'Remove a share' })
  removeShare(@Param('id') id: string, @Param('shareId') shareId: string, @Request() req: any) {
    return this.service.removeShare(id, shareId, req.user.id);
  }
}
