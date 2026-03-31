import { Controller, Get, Patch, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PipelineAlertsService } from './pipeline-alerts.service';
import { QueryAlertsDto } from './dto/pipeline-alert.dto';

@ApiTags('pipeline')
@Controller('pipeline/alerts')
export class PipelineAlertsController {
  constructor(private readonly alertsService: PipelineAlertsService) {}

  @Get()
  findAll(@Query() query: QueryAlertsDto) {
    return this.alertsService.findAll(query);
  }

  @Get('count')
  countUnacknowledged() {
    return this.alertsService.countUnacknowledged();
  }

  @Patch(':id/acknowledge')
  acknowledge(@Param('id') id: string) {
    return this.alertsService.acknowledge(id);
  }
}
