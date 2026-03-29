import { IsEnum, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AlertType, AlertFrequency, AlertChannel } from '../entities/alert.entity';

export class CreateAlertDto {
  @ApiProperty({ enum: AlertType })
  @IsEnum(AlertType)
  alertType: AlertType;

  @ApiProperty({ example: 'energie-electrique' })
  @IsString()
  filterValue: string;

  @ApiPropertyOptional({ enum: AlertFrequency })
  @IsOptional()
  @IsEnum(AlertFrequency)
  frequency?: AlertFrequency;

  @ApiPropertyOptional({ enum: AlertChannel })
  @IsOptional()
  @IsEnum(AlertChannel)
  channel?: AlertChannel;
}
