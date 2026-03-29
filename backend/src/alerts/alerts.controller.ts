import { Controller, Get, Post, Delete, Patch, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AlertsService } from './alerts.service';
import { CreateAlertDto } from './dto/create-alert.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('alerts')
@Controller('alerts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AlertsController {
  constructor(private readonly service: AlertsService) {}

  @Post()
  @ApiOperation({ summary: 'Create an alert' })
  create(@Request() req: any, @Body() dto: CreateAlertDto) {
    return this.service.create(req.user.id, dto);
  }

  @Get('my')
  @ApiOperation({ summary: 'Get my alerts' })
  findMine(@Request() req: any) {
    return this.service.findByUser(req.user.id);
  }

  @Patch(':id/toggle')
  @ApiOperation({ summary: 'Toggle alert active state' })
  toggle(@Param('id') id: string, @Request() req: any) {
    return this.service.toggleActive(id, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an alert' })
  delete(@Param('id') id: string, @Request() req: any) {
    return this.service.delete(id, req.user.id);
  }
}
