import { IsString, IsOptional, IsEnum, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CommentType } from '../entities/comment.entity';

export class CreateCommentDto {
  @ApiProperty()
  @IsUUID()
  textId: string;

  @ApiProperty()
  @IsString()
  content: string;

  @ApiPropertyOptional({ enum: CommentType })
  @IsOptional()
  @IsEnum(CommentType)
  type?: CommentType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  articleRef?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  parentId?: string;
}
