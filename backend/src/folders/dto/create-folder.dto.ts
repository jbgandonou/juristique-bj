import { IsString, IsOptional, IsArray, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFolderDto {
  @ApiProperty({ example: 'Affaire Client X' })
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: '#1A237E' })
  @IsOptional()
  @IsString()
  color?: string;
}

export class AddTextToFolderDto {
  @ApiProperty()
  @IsUUID()
  textId: string;
}

export class ShareFolderDto {
  @ApiProperty({ description: 'Email of user to share with' })
  @IsString()
  email: string;

  @ApiProperty({ enum: ['read', 'comment', 'edit'], default: 'read' })
  @IsString()
  permission: string;
}
