import { IsString, IsOptional, IsUUID, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAnnotationDto {
  @ApiProperty()
  @IsUUID()
  textId: string;

  @ApiProperty({ example: 'Important pour le dossier Client X' })
  @IsString()
  content: string;

  @ApiPropertyOptional({ example: 'Art. 15' })
  @IsOptional()
  @IsString()
  articleRef?: string;

  @ApiPropertyOptional({ example: '#FFD700' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  folderId?: string;
}
