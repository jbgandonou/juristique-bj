import { IsOptional, IsString, IsEnum, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { TextType, TextStatus } from '../entities/legal-text.entity';

export class QueryLegalTextDto extends PaginationDto {
  @ApiPropertyOptional({ example: 'BJ' })
  @IsOptional()
  @IsString()
  countryCode?: string;

  @ApiPropertyOptional({ example: 'constitution' })
  @IsOptional()
  @IsString()
  themeSlug?: string;

  @ApiPropertyOptional({ enum: TextType })
  @IsOptional()
  @IsEnum(TextType)
  textType?: TextType;

  @ApiPropertyOptional({ enum: TextStatus })
  @IsOptional()
  @IsEnum(TextStatus)
  status?: TextStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  isInForce?: boolean;
}
