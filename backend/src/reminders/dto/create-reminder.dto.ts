import { IsString, IsOptional, IsUUID, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateReminderDto {
  @ApiProperty({ example: 'Relire la loi n°2024-15' })
  @IsString()
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: '2026-04-05T09:00:00Z' })
  @IsDateString()
  remindAt: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  textId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  folderId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  annotationId?: string;

  @ApiPropertyOptional({ example: 'urgent' })
  @IsOptional()
  @IsString()
  label?: string;

  @ApiPropertyOptional({ example: '⏰' })
  @IsOptional()
  @IsString()
  sticker?: string;
}
