import { Controller, Get, Post, Delete, Patch, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('comments')
@Controller('comments')
export class CommentsController {
  constructor(private readonly service: CommentsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a comment' })
  create(@Request() req: any, @Body() dto: CreateCommentDto) {
    return this.service.create(req.user.id, dto);
  }

  @Get('by-text/:textId')
  @ApiOperation({ summary: 'Get comments for a legal text' })
  findByText(@Param('textId') textId: string, @Query() pagination: PaginationDto) {
    return this.service.findByText(textId, pagination);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my comments' })
  findMine(@Request() req: any, @Query() pagination: PaginationDto) {
    return this.service.findByUser(req.user.id, pagination);
  }

  @Patch(':id/upvote')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upvote a comment' })
  upvote(@Param('id') id: string) {
    return this.service.upvote(id);
  }

  @Patch(':id/flag')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Flag a comment' })
  flag(@Param('id') id: string) {
    return this.service.flag(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete my comment' })
  delete(@Param('id') id: string, @Request() req: any) {
    return this.service.delete(id, req.user.id);
  }
}
