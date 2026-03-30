import { IsString, IsOptional, IsEnum, IsInt, IsBoolean, IsArray, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { TextType, TextStatus } from '../entities/legal-text.entity';

export class UpdateLegalTextDto {
  @ApiPropertyOptional({ example: 'Constitution de la République du Bénin' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ example: 'Loi n°2023-15' })
  @IsOptional()
  @IsString()
  reference?: string;

  @ApiPropertyOptional({ enum: TextType })
  @IsOptional()
  @IsEnum(TextType)
  textType?: TextType;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  hierarchyRank?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contentText?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  summary?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  countryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  themeIds?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  promulgationDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  publicationDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  effectiveDate?: string;

  @ApiPropertyOptional({ enum: TextStatus })
  @IsOptional()
  @IsEnum(TextStatus)
  status?: TextStatus;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isInForce?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isVerified?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  verifiedBy?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  verifiedAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sourceUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sourceName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  pdfS3Key?: string;

  @ApiPropertyOptional()
  @IsOptional()
  ocrQuality?: number;
}
