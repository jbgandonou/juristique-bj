import { IsString, IsOptional, IsUUID, IsBoolean, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateStickyNoteDto {
  @ApiProperty({ example: 'Vérifier art. 15 avec le client' })
  @IsString()
  content: string;

  @ApiPropertyOptional({ example: '#FFF9C4' })
  @IsOptional()
  @IsString()
  color?: string;

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
  @IsBoolean()
  isPinned?: boolean;
}
