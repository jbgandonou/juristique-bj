import { IsString, IsOptional, Length } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCountryDto {
  @ApiProperty({ example: 'République du Bénin' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'BJ' })
  @IsString()
  @Length(2, 2)
  code: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  flagUrl?: string;

  @ApiPropertyOptional({ example: "Afrique de l'Ouest" })
  @IsOptional()
  @IsString()
  region?: string;

  @ApiPropertyOptional({ example: 'Civil law' })
  @IsOptional()
  @IsString()
  legalSystem?: string;

  @ApiPropertyOptional({ example: 'Français' })
  @IsOptional()
  @IsString()
  officialLang?: string;
}
