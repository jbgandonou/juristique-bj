import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePipelineJobDto {
  @ApiProperty({ example: 'FAOLEX' })
  @IsString()
  sourceName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sourceUrl?: string;
}

export class CreateSourceConfigDto {
  @ApiProperty({ example: 'FAOLEX' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'api' })
  @IsString()
  scraperType: string;

  @ApiProperty({ example: 'https://www.fao.org/faolex/' })
  @IsString()
  baseUrl: string;

  @ApiPropertyOptional({ example: 'daily' })
  @IsOptional()
  @IsString()
  schedule?: string;
}
