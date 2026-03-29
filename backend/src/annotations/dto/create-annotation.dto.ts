import { IsString, IsOptional, IsUUID, IsNumber } from 'class-validator';
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

  @ApiPropertyOptional({ example: '📌' })
  @IsOptional()
  @IsString()
  sticker?: string;

  @ApiPropertyOptional({ example: 'urgent', enum: ['urgent', 'a_relire', 'important', 'en_cours', 'termine', 'question'] })
  @IsOptional()
  @IsString()
  label?: string;

  @ApiPropertyOptional({ example: 150 })
  @IsOptional()
  @IsNumber()
  selectionStart?: number;

  @ApiPropertyOptional({ example: 230 })
  @IsOptional()
  @IsNumber()
  selectionEnd?: number;

  @ApiPropertyOptional({ example: 'Le présent texte régit les activités' })
  @IsOptional()
  @IsString()
  selectedText?: string;

  @ApiPropertyOptional({ example: '#FFF3BF' })
  @IsOptional()
  @IsString()
  highlightColor?: string;
}
