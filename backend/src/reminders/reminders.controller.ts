import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RemindersService } from './reminders.service';
import { CreateReminderDto } from './dto/create-reminder.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('reminders')
@Controller('reminders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RemindersController {
  constructor(private readonly service: RemindersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a reminder' })
  create(@Request() req: any, @Body() dto: CreateReminderDto) {
    return this.service.create(req.user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all my reminders' })
  findAll(@Request() req: any) {
    return this.service.findAll(req.user.id);
  }

  @Get('upcoming')
  @ApiOperation({ summary: 'List upcoming reminders' })
  findUpcoming(@Request() req: any) {
    return this.service.findUpcoming(req.user.id);
  }

  @Patch(':id/complete')
  @ApiOperation({ summary: 'Mark reminder as completed' })
  complete(@Param('id') id: string, @Request() req: any) {
    return this.service.markCompleted(id, req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a reminder' })
  update(@Param('id') id: string, @Request() req: any, @Body() dto: Partial<CreateReminderDto>) {
    return this.service.update(id, req.user.id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a reminder' })
  delete(@Param('id') id: string, @Request() req: any) {
    return this.service.delete(id, req.user.id);
  }
}
