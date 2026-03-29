import { IsUUID, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBookmarkDto {
  @ApiProperty()
  @IsUUID()
  textId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}
