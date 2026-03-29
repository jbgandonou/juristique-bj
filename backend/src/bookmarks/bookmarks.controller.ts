import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BookmarksService } from './bookmarks.service';
import { CreateBookmarkDto } from './dto/create-bookmark.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('bookmarks')
@Controller('bookmarks')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BookmarksController {
  constructor(private readonly service: BookmarksService) {}

  @Post()
  @ApiOperation({ summary: 'Create a bookmark' })
  create(@Request() req: any, @Body() dto: CreateBookmarkDto) {
    return this.service.create(req.user.id, dto);
  }

  @Get('my')
  @ApiOperation({ summary: 'Get my bookmarks' })
  findMine(@Request() req: any, @Query() pagination: PaginationDto) {
    return this.service.findByUser(req.user.id, pagination);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a bookmark' })
  delete(@Param('id') id: string, @Request() req: any) {
    return this.service.delete(id, req.user.id);
  }
}
